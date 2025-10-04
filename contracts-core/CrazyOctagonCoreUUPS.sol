// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
CrazyOctagon — Monad testnet (UUPS)
Две части:
1) Core (этот контракт): вся игровая логика и средства (пулы, ping, burn/claim, кладбище/breed, реварды), вызовы LP через внешний Helper.
2) Helper+Reader (отдельный контракт):
   - LP-менеджер (UniswapV2 swap/add/remove) — callable только Core.
   - Reader-инспекторы для UI.

Требования из ТЗ (строго как в CrazyCube3, без халявы):
- Пользователь сам цену не передаёт. «Скрипт-ценник» (отдельная роль PRICER_ROLE) обновляет цену floor и курс CRAA заранее.
- Стоимость брида 40% от floor: 30% OCTA + 10% CRAA; из 30% OCTA — 10% floor → LP, 20% → главный пул; 10% CRAA сжигается.
- LP привязывается к revived NFT и выдаётся при claim (по умолчанию — LP-токенами). М��неты от ping копятся до 7 дней (maxAccumulation конфигурируется).
- Пинг: первый активирует; кулдаун; динамический бонус +2.7%/пинг с клампами; при рождении мультипликатор сразу −50%.
- Родители при бриде теряют по 1 звезде, ниже 0 — нельзя; у revived заводские звезды восстанавливаются (кэп 6) + возможен бонус +1..+5 (кэп 6).
*/

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
// IERC721Receiver not required: we use transferFrom, not safeTransferFrom
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

// ===== LP Helper interface (внешний контракт Helper+Reader) =====
interface ILPHelper {
    function addLiquidityForCore(uint256 amountOcta, uint16 slippageBps)
        external returns (uint amountA, uint amountB, uint liquidity, address lpToken);
    function removeLiquidityForCoreSplitToUserBurnOcta(address to, uint256 lpAmount)
        external returns (uint amountA, uint amountB);
    function router() external view returns (address);
    function pairToken() external view returns (address);
}

// ===== Оракулы =====
interface IFloorOracle { function latestFloorPrice() external view returns (uint256 price, uint8 decimals); }
interface IRateOracle  { function latestRate()       external view returns (uint256 rate,  uint8 decimals); }

contract CrazyOctagonCoreUUPS is
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // ───── roles
    bytes32 public constant ADMIN_ROLE        = keccak256("ADMIN_ROLE");
    bytes32 public constant CONFIGURATOR_ROLE = keccak256("CONFIGURATOR_ROLE");
    bytes32 public constant FUND_ROLE         = keccak256("FUND_ROLE");
    bytes32 public constant PRICER_ROLE       = keccak256("PRICER_ROLE"); // «скрипт-ценник»

    // ───── externals
    IERC721 public nft;
    IERC20  public octa;
    IERC20  public craa;

    // ───── constants/cfg
    uint256 public constant MAX_SUPPLY = 20_000;
    address public deadAddress;
    bool    public manualActivateEnabled;

    // ───── game data
    struct NFTData { uint8 rarity; uint8 initialStars; uint8 gender; bool isActivated; }
    struct NFTState {
        // packed small fields (fit into one slot): 6+6+1+1+1 = 15 bytes
        uint48 lastPingTime;   // ts последнего пинга
        uint48 lastBreedTime;  // ts последнего брида
        uint8  currentStars;   // 0..6
        uint8  bonusStars;     // +звёзды от revive-бонуса
        bool   isInGraveyard;
        // separate slot
        uint256 lockedOcta;    // накоплено пингами
    }
    mapping(uint256 => NFTData)  public meta;
    mapping(uint256 => NFTState) public state;

    // ───── pools
    uint256 public totalLockedForRewards;
    uint256 public monthlyRewardPool;
    uint256 public claimReservePool;

    uint256 public monthDuration;
    uint256 public lastUnlockTimestamp;
    uint16  public monthlyUnlockPercentageBps;
    bool    public returnUnusedAtPeriodEnd;

    bool    public evenDailyDistribution;
    uint256 public distributionDenominator;
    uint256 public sharePerPing;
    uint256 public minSharePerPing;
    bool    public manualShareMode;
    uint256 public manualSharePerPing;

    uint256 public sweepInterval;
    uint256 public lastSweep;

    // ───── ping
    uint256 public pingInterval;
    uint256 public maxAccumulation; // 7d для проды
    mapping(uint8 => uint16) public rarityBonusBps; // 1..6 -> 0..5000 (0..50%)
    mapping(uint256 => int16) public bonusBps;      // динамика +2.7% за пинг
    mapping(uint256 => int16) public specialBps;    // ручной пер-нт per NFT
    int16 public minPenaltyClampBps;                // −50%
    int16 public maxBonusClampBps;                  // +97%
    uint16 public safetyBps;                        // резерв на клейм (3%)

    // ───── burn
    uint16 public burnFeeBps; // 10%
    struct BurnSplit { uint16 playerBps; uint16 poolBps; uint16 burnBps; }
    mapping(uint32 => BurnSplit) public burnSplits;
    struct BurnRecord {
        address owner;
        uint256 totalAmount;
        uint256 claimAt;
        uint256 graveReleaseAt;
        bool    claimed;
        uint32  waitMinutes;
    }
    mapping(uint256 => BurnRecord) public burns;
    uint256 public graveyardCooldown; // сколько NFT лежит в грейве перед revive

    // ───── breed / LP / sponsor
    uint16  public breedOCTABps;        // 30% floor OCTA
    uint16  public breedCRAABps;        // 10% floor CRAA
    uint16  public breedLPfromFloorBps; // 10% floor -> LP (из OCTA-части)

    address public sponsorTreasury;
    uint16  public sponsorBps;          // по умолчанию 100%

    // LP конфиг (в Helper); core хранит только менеджер/режим/слиппедж и привязку к NFT
    ILPHelper public lpHelper;
    uint16    public lpSlippageBps; // 3%
    // LP payout mode переключатели удалены: единственный режим — удалить ликвидность,
    // сжечь OCTA и отдать пользователю pair-токен (WMON)

    struct NFTLP { address helper; address pair; uint256 lpAmount; uint256 octaDeposited; uint256 pairDeposited; }
    mapping(uint256 => NFTLP) public nftLP;
    uint256 private _lastLP; uint256 private _lastA; uint256 private _lastB; address private _lastPair;

    // ───── oracles/price
    IFloorOracle public floorOracle; bool public useFloorOracle; uint256 public manualFloorPrice;
    IRateOracle  public craRateOracle; bool public useCRARateOracle; uint256 public craPerOctaRate;

    // ───── revive gate 10..20
    uint16 public reviveMinGate; uint16 public reviveMaxGate; uint32 public reviveSinceLastBonus;

    // ───── grave queue
    uint256[] private graveList;
    mapping(uint256 => bool)    private inGrave;
    mapping(uint256 => uint256) private graveIdx;
    uint256 public graveCursor;
    uint16  public graveChunkSize;
    // Reservation lock for race-free selection
    mapping(uint256 => address) private graveReservedBy;

    // --- Breed cooldown storage (append-only) ---
    uint32 public breedCooldownMin;      // minimal cooldown in seconds (>=60)
    uint32 public breedCooldownDefault;  // default cooldown applied to parents and revived NFT
    uint32 public breedCooldownMax;      // maximal cooldown in seconds (<=7 days)
    mapping(uint256 => uint64) public breedUnlockAt; // timestamp until which the token cannot breed

    // ───── events
    event Pinged(uint256 indexed tokenId, uint256 reward, uint256 newLocked);
    event BurnScheduled(uint256 indexed tokenId, address indexed owner, uint256 amount, uint256 claimAt, uint32 waitMin);
    event BurnClaimed(uint256 indexed tokenId, address indexed owner, uint256 player, uint256 pool, uint256 burned);
    event BreedRequested(address indexed user, uint256 p1, uint256 p2, uint256 octaCost, uint256 craaCost, uint256 lpPart, uint256 octaToMain, uint256 sponsorFee);
    event BreedFinalized(address indexed user, uint256 revived, uint8 bonusStars);
    event GraveSeedBatch(uint256 requested, uint256 seeded);
    // Most config/safety events removed to reduce bytecode size

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(address _nft, address _octa, address admin) public initializer {
        require(_nft!=address(0) && _octa!=address(0) && admin!=address(0), "bad addrs");
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        nft  = IERC721(_nft);
        octa = IERC20(_octa);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(CONFIGURATOR_ROLE, admin);
        _grantRole(FUND_ROLE, admin);
        _grantRole(PRICER_ROLE, admin); // по умолчанию админ — ценник; можно выдать отдельному скрипту позже

        _initDefaults();

        // дефолт: сутки (прод), можно мгновенно менять сеттерами/минутами
        monthDuration = 1 days;
        monthlyUnlockPercentageBps = 400; // 4%
        returnUnusedAtPeriodEnd = true;
        evenDailyDistribution   = true;
        distributionDenominator = 20_000;
        minSharePerPing         = 1;
        pingInterval            = 1 days;
        maxAccumulation         = 7 days;
        sweepInterval           = 1 days;

        sponsorBps      = 10_000; // в проде снизьте через setSponsor
        sponsorTreasury = admin;

        lastUnlockTimestamp = block.timestamp;
        lastSweep           = block.timestamp;
        deadAddress = 0x000000000000000000000000000000000000dEaD;
    }

    function _initDefaults() internal {
        rarityBonusBps[1]=0; rarityBonusBps[2]=1000; rarityBonusBps[3]=2000;
        rarityBonusBps[4]=3000; rarityBonusBps[5]=4000; rarityBonusBps[6]=5000;
        minPenaltyClampBps = -5000; // −50%
        maxBonusClampBps   =  9700; // +97%
        safetyBps          =   300; // 3%
        burnFeeBps         =  1000; // 10%
        burnSplits[30]  = BurnSplit({playerBps:5000, poolBps:4000, burnBps:1000});
        burnSplits[120] = BurnSplit({playerBps:7000, poolBps:2000, burnBps:1000});
        burnSplits[480] = BurnSplit({playerBps:8000, poolBps:1000, burnBps:1000});
        graveyardCooldown = 1 hours;
        graveChunkSize    = 50;
        lpSlippageBps = 300; // 3%
    // LP: режим фиксирован — burn OCTA + выдать pair (см. _payoutLP)
        useFloorOracle     = false; manualFloorPrice = 10_000 ether;
        useCRARateOracle   = false; craPerOctaRate  = 1 ether; // 1 CRAA = 1 OCTA (старт)
        reviveMinGate = 10; reviveMaxGate = 20;

        breedCooldownMin = 60;           // 1 minute
        breedCooldownDefault = 1 hours;  // 1 hour default for parents & revived NFT
        breedCooldownMax = 7 days;       // upper cap
    }

    // ───── UUPS guard
    function _authorizeUpgrade(address) internal override onlyRole(ADMIN_ROLE) {}

    // ───── modifiers
    modifier onlyConf()  { require(hasRole(CONFIGURATOR_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender), "no conf"); _; }
    modifier onlyFund()  { require(hasRole(FUND_ROLE, msg.sender)         || hasRole(ADMIN_ROLE, msg.sender), "no fund"); _; }
    modifier onlyPrice() { require(hasRole(PRICER_ROLE, msg.sender), "no price role"); _; }

    // ───── pause
    function pause()   external onlyRole(ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(ADMIN_ROLE) { _unpause(); }

    // ───── helpers
    function _rnd(bytes32 extra) private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.prevrandao, msg.sender, address(this), extra)));
    }

    function poke() external { _autoUnlock(); }

    // ───── sweeping & unlock
    function _maybeSweep() internal {
        if (block.timestamp < lastSweep + sweepInterval) return;
        uint256 bal = octa.balanceOf(address(this));
        uint256 accounted = totalLockedForRewards + monthlyRewardPool + claimReservePool;
        if (bal > accounted) {
            uint256 excess = bal - accounted;
            totalLockedForRewards += excess;
        }
        lastSweep = block.timestamp;
    }

    function _recalcShare() internal {
        if (manualShareMode) { sharePerPing = manualSharePerPing; return; }
        if (!evenDailyDistribution) return;
        uint256 per = pingInterval==0 ? 1 : (monthDuration / pingInterval);
        if (per == 0) per = 1;
        sharePerPing = monthlyRewardPool / (distributionDenominator * per);
        if (sharePerPing < minSharePerPing && monthlyRewardPool > 0) {
            sharePerPing = minSharePerPing;
        }
    }

    // direct share recalc can be triggered via poke() or explicitly via this call
    function recalcShareNow() external onlyConf { _maybeSweep(); _recalcShare(); }

    function _autoUnlock() internal {
        _maybeSweep();
        if (block.timestamp < lastUnlockTimestamp + monthDuration) return;
        if (returnUnusedAtPeriodEnd && monthlyRewardPool > 0) {
            totalLockedForRewards += monthlyRewardPool;
            monthlyRewardPool = 0;
        }
        uint256 unlockAmount = (totalLockedForRewards * monthlyUnlockPercentageBps) / 10_000;
        if (unlockAmount > 0) { totalLockedForRewards -= unlockAmount; monthlyRewardPool += unlockAmount; }
        lastUnlockTimestamp = block.timestamp;
        _recalcShare();
    }

    // ───── admin/config
    function setMonthDuration(uint256 sec_) external onlyConf { require(sec_>=60 && sec_<=30 days, "1m..30d"); monthDuration=sec_; _recalcShare(); }
    function setMonthlyUnlockPercentage(uint16 bps) external onlyConf { require(bps<=10000,"bps"); monthlyUnlockPercentageBps=bps; }
    function setReturnUnused(bool on) external onlyConf { returnUnusedAtPeriodEnd=on; }
    function setEvenDailyDistribution(bool on) external onlyConf { evenDailyDistribution=on; _recalcShare(); }
    function setDistributionDenominator(uint256 d) external onlyConf { require(d>=1&&d<=1_000_000,"den"); distributionDenominator=d; _recalcShare(); }
    function setMinSharePerPing(uint256 v) external onlyConf { minSharePerPing=v; _recalcShare(); }
    function setPingTiming(uint256 intervalSec, uint256 maxAccSec) external onlyConf {
        require(intervalSec>=60 && intervalSec<=3 days,"ping");
        require(maxAccSec>=intervalSec && maxAccSec<=14 days,"acc");
        pingInterval=intervalSec; maxAccumulation=maxAccSec;
        _recalcShare();
    }
    function setSweepInterval(uint256 sec_) external onlyConf { require(sec_>=60 && sec_<=7 days,"sweep"); sweepInterval=sec_; }
    function setSafetyBps(uint16 bps) external onlyConf { require(bps<=1000,"safety<=10%"); safetyBps=bps; }
    function setBurnFeeBps(uint16 bps) external onlyConf { require(bps<=2000,"fee<=20%"); burnFeeBps=bps; }
    function setRarityBonus(uint8 r, uint16 bps) external onlyConf { require(r>=1&&r<=6,"rar"); rarityBonusBps[r]=bps; }
    function setClampBounds(int16 minPen, int16 maxBon) external onlyConf { require(minPen>=-9999&&minPen<=0,"min"); require(maxBon>=0&&maxBon<=int16(32767),"max"); minPenaltyClampBps=minPen; maxBonusClampBps=maxBon; }
    function setSpecialBonus(uint256 tokenId, int16 bps) external onlyConf { require(bps>=-5000&&bps<=int16(32767),"sp"); specialBps[tokenId]=bps; }
    function setGraveChunkSize(uint16 s) external onlyConf { require(s>=1 && s<=1000, "1..1000"); graveChunkSize = s; }

    // LP / CRAA / sponsor
    function setLPHelper(address helper) external onlyConf { require(helper!=address(0),"zero"); lpHelper = ILPHelper(helper); }
    function setLPSlippageBps(uint16 bps) external onlyConf { require(bps<=2000,"slip"); lpSlippageBps=bps; }
    // setLPPayoutMode удалён — единый режим без переключений

    function setCRAA(address token) external onlyConf { require(token!=address(0),"zero addr"); craa = IERC20(token); }
    function setCRARateManual(uint256 rate1e18) external onlyPrice { require(rate1e18>0,"rate"); craPerOctaRate=rate1e18; }
    function setCRARateOracle(address o, bool useIt) external onlyConf { if(useIt)require(o!=address(0),"zero oracle"); craRateOracle=IRateOracle(o); useCRARateOracle=useIt; }
    function setFloorOracle(address o, bool useIt)   external onlyConf { if(useIt)require(o!=address(0),"zero oracle"); floorOracle=IFloorOracle(o); useFloorOracle=useIt; }
    function setManualFloor(uint256 floor1e18) external onlyPrice { require(floor1e18>0, "floor"); manualFloorPrice=floor1e18; }

    function setBreedPercents(uint16 octaBps,uint16 craaBps,uint16 lpFromFloorBps) external onlyConf {
        require(octaBps + craaBps == 4000, "sum!=40%");
        require(lpFromFloorBps <= octaBps, "lp<=octaPart");
        breedOCTABps=octaBps; breedCRAABps=craaBps; breedLPfromFloorBps=lpFromFloorBps;
    }
    function setSponsor(address treasury, uint16 bps) external onlyConf { require(treasury!=address(0),"zero"); require(bps<=20000,"<=200%"); sponsorTreasury=treasury; sponsorBps=bps; }
    function setDeadAddress(address a) external onlyConf { require(a!=address(0),"zero"); deadAddress=a; }
    function setManualActivateEnabled(bool on) external onlyConf { manualActivateEnabled=on; }

    function setBreedCooldowns(uint32 minSec, uint32 defaultSec, uint32 maxSec) external onlyConf {
        require(minSec >= 60, "min<60s");
        require(maxSec <= 7 days, "max>7d");
        require(minSec <= defaultSec && defaultSec <= maxSec, "order");
        breedCooldownMin = minSec;
        breedCooldownDefault = defaultSec;
        breedCooldownMax = maxSec;
    }

    function _requireBreedReady(uint256 tokenId, string memory err) internal view {
        uint64 unlockAt = breedUnlockAt[tokenId];
        if (unlockAt == 0) return;
        require(block.timestamp >= unlockAt, err);
    }

    function _effectiveBreedCooldown() internal view returns (uint32 cd) {
        cd = breedCooldownDefault;
        if (cd == 0) return 0;
        uint32 minCd = breedCooldownMin;
        if (minCd != 0 && cd < minCd) cd = minCd;
        uint32 maxCd = breedCooldownMax;
        if (maxCd != 0 && cd > maxCd) cd = maxCd;
    }

    // (minute-based convenience setters were removed to reduce bytecode size)

    // ===== manual distribution override (instant effect)
    function setManualSharePerPing(uint256 perPing, bool on) external onlyConf {
        manualSharePerPing = perPing;
        manualShareMode    = on;
        // no unlock wait: just use this value immediately
    }
    // Move any amount from main to monthly immediately (no wait)
    function forceMoveToMonthly(uint256 amount) external onlyConf {
        require(amount>0, "amount");
        require(totalLockedForRewards >= amount, "no main");
        totalLockedForRewards -= amount;
        monthlyRewardPool     += amount;
        _recalcShare();
    }

    // ===== Admin emergency withdrawals (admin = бог)
    function adminWithdrawERC20(address token, address to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(to!=address(0), "to");
        IERC20(token).safeTransfer(to, amount);
    }
    function adminWithdrawERC721(address nftAddr, uint256 tokenId, address to) external onlyRole(ADMIN_ROLE) {
        require(to!=address(0), "to");
        IERC721(nftAddr).safeTransferFrom(address(this), to, tokenId);
    }

    // ───── Revive Gate
    function setReviveGate(uint16 min_, uint16 max_) external onlyConf { require(min_>=1 && max_>=min_, "gate"); reviveMinGate = min_; reviveMaxGate = max_; }

    // ───── NFT Metadata Setters
    function _setMeta(uint256 tokenId, uint8 rarity, uint8 initialStars, uint8 gender) internal {
        require(!meta[tokenId].isActivated, "locked");
        require(rarity>=1 && rarity<=6, "rar");
        require(initialStars<=6, "stars");
        require(gender==1 || gender==2, "gender");
        meta[tokenId] = NFTData(rarity, initialStars, gender, false);
        state[tokenId].currentStars = initialStars;
    }
    
    function adminSetMeta(uint256 tokenId, uint8 rarity, uint8 initialStars, uint8 gender) external onlyConf {
        _setMeta(tokenId, rarity, initialStars, gender);
    }
    
    function adminSetMetaBatch(uint256[] calldata ids, uint8[] calldata rar, uint8[] calldata stars, uint8[] calldata genders) external onlyConf {
        require(ids.length==rar.length && rar.length==stars.length && stars.length==genders.length, "len");
        for (uint i=0;i<ids.length;i++) { _setMeta(ids[i], rar[i], stars[i], genders[i]); }
    }

    // ───── Admin: seed graveyard with owned NFTs (batched)
    // Soft limit: recommend <= 200 per tx to avoid block gas limits.
    function adminSeedGraveBatch(uint256[] calldata ids) external onlyConf {
        require(ids.length>0 && ids.length<=200);
        uint256 seeded;
        for (uint256 i=0;i<ids.length;i++) {
            uint256 id = ids[i];
            if (id==0 || id>MAX_SUPPLY) continue; // skip invalid ids silently
            if (inGrave[id]) continue;             // already in grave
            // must be owned by Core so we can revive later
            if (nft.ownerOf(id) != address(this)) continue;
            state[id].isInGraveyard = true;
            inGrave[id] = true;
            graveIdx[id] = graveList.length;
            graveList.push(id);
            // respect cooldown economy: make eligible after graveyardCooldown
            burns[id].graveReleaseAt = block.timestamp + graveyardCooldown;
            seeded += 1;
        }
        emit GraveSeedBatch(ids.length, seeded);
    }

    // ───── PING
    function ping(uint256 tokenId) external nonReentrant whenNotPaused {
        require(tokenId>0 && tokenId<=MAX_SUPPLY, "id");
        require(nft.ownerOf(tokenId)==msg.sender, "owner");
        _autoUnlock();
        if (!meta[tokenId].isActivated) meta[tokenId].isActivated = true;
        require(!state[tokenId].isInGraveyard, "grave");

        NFTState storage st = state[tokenId];
        if (st.lastPingTime>0) require(block.timestamp >= st.lastPingTime + pingInterval, "cooldown");

        uint256 elapsed = st.lastPingTime==0 ? pingInterval : (block.timestamp - uint256(st.lastPingTime));
        if (elapsed > maxAccumulation) elapsed = maxAccumulation;
        uint256 periods = elapsed / pingInterval; if (periods==0) periods=1;

        uint256 spp = sharePerPing;
        uint256 pool = monthlyRewardPool;
        uint256 base = spp * periods;
        uint16 rBps = rarityBonusBps[ meta[tokenId].rarity ];
        uint256 reward = base + (base * rBps) / 10_000;

        int16 eff = bonusBps[tokenId];
        int16 sps  = specialBps[tokenId];
        int256 e = int256(eff) + int256(sps);
        if (e < int256(minPenaltyClampBps)) e = minPenaltyClampBps;
        if (e > int256(maxBonusClampBps))   e = maxBonusClampBps;
        if (e < 0) { uint256 pen = reward * uint256(int256(-e)) / 10_000; reward = reward > pen ? reward - pen : 0; }
        else if (e > 0) { reward += reward * uint256(uint256(e)) / 10_000; }

        if (reward > pool) reward = pool;
        require(pool >= reward, "pool empty");

        pool -= reward; monthlyRewardPool = pool; st.lockedOcta += reward; st.lastPingTime = uint48(block.timestamp);

        uint256 safety = (reward * safetyBps) / 10_000;
        if (safety > 0) {
            if (totalLockedForRewards >= safety) totalLockedForRewards -= safety;
            else if (monthlyRewardPool >= safety) monthlyRewardPool -= safety;
            else { safety = 0; }
        }
        claimReservePool += (reward + safety);

        int16 next = eff + int16(uint16(270)); // +2.7% за успешный пинг
        if (next > 9720) next = 9720;
        bonusBps[tokenId] = next;
        emit Pinged(tokenId, reward, st.lockedOcta);
    }

    // ───── BURN / CLAIM
    function burnNFT(uint256 tokenId, uint32 waitMinutes) external nonReentrant whenNotPaused {
        require(tokenId>0 && tokenId<=MAX_SUPPLY, "id");
        require(nft.ownerOf(tokenId)==msg.sender, "owner");
        require(meta[tokenId].isActivated && state[tokenId].lastPingTime > 0, "need first ping");
        require(!state[tokenId].isInGraveyard, "grave");

        BurnSplit memory sp = burnSplits[waitMinutes];
        require(sp.playerBps + sp.poolBps + sp.burnBps == 10_000, "invalid wait");

    uint256 fee = (state[tokenId].lockedOcta * burnFeeBps) / 10_000;
    if (fee>0) { octa.safeTransferFrom(msg.sender, address(this), fee); _sink(fee); }

        nft.transferFrom(msg.sender, address(this), tokenId);

        burns[tokenId] = BurnRecord({
            owner: msg.sender,
            totalAmount: state[tokenId].lockedOcta,
            claimAt: block.timestamp + uint256(waitMinutes) * 1 minutes,
            graveReleaseAt: block.timestamp + graveyardCooldown,
            claimed: false,
            waitMinutes: waitMinutes
        });

        state[tokenId].lockedOcta = 0;
        state[tokenId].isInGraveyard = true;

        if (!inGrave[tokenId]) {
            inGrave[tokenId] = true;
            graveIdx[tokenId] = graveList.length;
            graveList.push(tokenId);
        }

        emit BurnScheduled(tokenId, msg.sender, burns[tokenId].totalAmount, burns[tokenId].claimAt, waitMinutes);
    }

    function claimBurnRewards(uint256 tokenId) external nonReentrant {
        BurnRecord storage rec = burns[tokenId];
        require(rec.owner==msg.sender, "owner");
        require(!rec.claimed, "claimed");
        require(block.timestamp >= rec.claimAt, "early");

        BurnSplit memory sp = burnSplits[rec.waitMinutes];
        require(sp.playerBps + sp.poolBps + sp.burnBps == 10_000, "split");

        uint256 player = (rec.totalAmount * sp.playerBps)/10_000;
        uint256 pool   = (rec.totalAmount * sp.poolBps)/10_000;
        uint256 burned = (rec.totalAmount * sp.burnBps)/10_000;
        rec.claimed = true;

        uint256 safety = (rec.totalAmount * safetyBps)/10_000;
    uint256 toRelease = rec.totalAmount + safety;
    if (claimReservePool >= toRelease) claimReservePool -= toRelease;
    else { claimReservePool = 0; }

    _payoutLP(tokenId);
    if (player>0) octa.safeTransfer(msg.sender, player);
        if (pool>0)   totalLockedForRewards += pool;
        if (burned>0) _sink(burned);

        emit BurnClaimed(tokenId, msg.sender, player, pool, burned);
    }

    function _sink(uint256 amount) internal { if (amount>0) octa.safeTransfer(deadAddress, amount); }

    // ───── floor / CRAA rate
    function _getFloor() internal view returns (uint256) {
        if (useFloorOracle && address(floorOracle)!=address(0)) {
            (uint256 p, uint8 d) = floorOracle.latestFloorPrice();
            if (p>0) return d==18 ? p : (d<18 ? p*(10**(18-d)) : p/(10**(d-18)));
        }
        return manualFloorPrice;
    }
    function _getCRARate() internal view returns (uint256) {
        if (useCRARateOracle && address(craRateOracle)!=address(0)) {
            (uint256 r, uint8 d) = craRateOracle.latestRate();
            if (r>0) return d==18 ? r : (d<18 ? r*(10**(18-d)) : r/(10**(d-18)));
        }
        return craPerOctaRate; // CRAA per 1 OCTA (1e18)
    }

    // ───── BREED (цены on-chain, без ввода от пользователя)
    function isGraveyardReady() public view returns (bool ok) {
        uint256 n = graveList.length; if (n==0) return false;
        uint256 start = (graveCursor % n);
        uint256 limit = graveChunkSize; if (limit > n) limit = n;
        for (uint256 i=0;i<limit;i++) {
            uint256 idx = (start + i) % n;
            uint256 id  = graveList[idx];
            if (inGrave[id] && graveReservedBy[id]==address(0) && block.timestamp >= burns[id].graveReleaseAt) return true;
        }
        return false;
    }

    function getBreedCosts() public view returns (uint256 octaCost, uint256 craaCost, uint256 lpFromOcta, uint256 octaToMain) {
        uint256 floor = _getFloor();
        uint256 octaPart     = (floor * breedOCTABps) / 10_000; // 30%
        uint256 craaPartOCTA = (floor * breedCRAABps) / 10_000; // 10% (в OCTA)
        uint256 rate         = _getCRARate(); // CRAA per OCTA (1e18)
        uint256 craaPart     = (craaPartOCTA * rate) / 1e18;
        uint256 lpNeed       = (floor * breedLPfromFloorBps) / 10_000; // 10% floor -> LP
        if (lpNeed > octaPart) lpNeed = octaPart;
        uint256 octaMain     = octaPart - lpNeed; // в главный пул
        return (octaPart, craaPart, lpNeed, octaMain);
    }

    function requestBreed(uint256 parent1Id, uint256 parent2Id, uint256 userRand) external nonReentrant whenNotPaused {
        require(parent1Id>0 && parent2Id>0 && parent2Id!=parent1Id, "bad ids");
        require(nft.ownerOf(parent1Id)==msg.sender && nft.ownerOf(parent2Id)==msg.sender, "owner");
        require(meta[parent1Id].isActivated && meta[parent2Id].isActivated, "not active");
        require(!state[parent1Id].isInGraveyard && !state[parent2Id].isInGraveyard, "grave");
        require(meta[parent1Id].gender != meta[parent2Id].gender, "gender");
        require(state[parent1Id].currentStars>0 && state[parent2Id].currentStars>0, "no stars");
        require(isGraveyardReady(), "grave empty");
        if (breedCRAABps>0) require(address(craa)!=address(0), "CRAA not set");

        _requireBreedReady(parent1Id, "parent1 cooldown");
        _requireBreedReady(parent2Id, "parent2 cooldown");

        (uint256 octaCost, uint256 craaCost, uint256 lpPart, uint256 octaMain) = getBreedCosts();
        require(octaCost + craaCost > 0, "zero price");

    uint256 sponsorFee = (octaCost * sponsorBps) / 10_000; // сверху OCTA-части
    uint256 totalOctaFromUser = octaCost + sponsorFee;
    if (totalOctaFromUser > 0) octa.safeTransferFrom(msg.sender, address(this), totalOctaFromUser);
    if (sponsorFee > 0) octa.safeTransfer(sponsorTreasury, sponsorFee);

        if (craaCost>0) {
            craa.safeTransferFrom(msg.sender, address(this), craaCost);
            craa.safeTransfer(deadAddress, craaCost); // CRAA burn
        }

        if (octaMain>0) totalLockedForRewards += octaMain; // 20% floor
        if (lpPart>0)   _addLiquidityForNFT(lpPart);        // 10% floor

        emit BreedRequested(msg.sender, parent1Id, parent2Id, octaCost, craaCost, lpPart, octaMain, sponsorFee);

        state[parent1Id].currentStars -= 1;
        state[parent2Id].currentStars -= 1;
        state[parent1Id].lastBreedTime = uint48(block.timestamp);
        state[parent2Id].lastBreedTime = uint48(block.timestamp);

        uint32 cooldown = _effectiveBreedCooldown();
        if (cooldown > 0) {
            uint64 unlockAt = uint64(block.timestamp + cooldown);
            breedUnlockAt[parent1Id] = unlockAt;
            breedUnlockAt[parent2Id] = unlockAt;
        }

        uint256 revived = _selectFromGraveyardAndRemove(userRand);
        _finalizeBreed(msg.sender, revived);
    }

    function _addLiquidityForNFT(uint256 amountOcta) internal {
        require(address(lpHelper)!=address(0), "LP helper");
    // tight approve -> helper тянет OCTA у core
    octa.forceApprove(address(lpHelper), 0);
    octa.forceApprove(address(lpHelper), amountOcta);
        (uint a, uint b, uint liq, address lpToken) = lpHelper.addLiquidityForCore(amountOcta, lpSlippageBps);
    octa.forceApprove(address(lpHelper), 0);
        _lastLP += liq; _lastA += a; _lastB += b; _lastPair = lpToken;
    }

    function _selectFromGraveyardAndRemove(uint256 userRand) internal returns (uint256 id) {
        uint256 n = graveList.length; require(n>0, "no grave");
        uint256 start = (graveCursor + (userRand % n)) % n;
        uint256 limit = graveChunkSize; if (limit > n) limit = n;
        uint256 foundIdx = type(uint256).max;
        for (uint256 i=0; i<limit; i++) {
            uint256 idx = (start + i) % n;
            uint256 cand = graveList[idx];
            if (inGrave[cand] && block.timestamp >= burns[cand].graveReleaseAt) { foundIdx = idx; break; }
        }
        require(foundIdx != type(uint256).max, "no eligible in window");
        uint256 candId = graveList[foundIdx];
        require(graveReservedBy[candId]==address(0), "reserved");
        graveReservedBy[candId] = msg.sender; // optimistic lock
        inGrave[candId] = false;
        uint256 lastIndex = n-1;
        if (foundIdx != lastIndex) { uint256 lastId = graveList[lastIndex]; graveList[foundIdx] = lastId; graveIdx[lastId] = foundIdx; }
        graveList.pop();
        if (graveList.length > 0) graveCursor = (foundIdx % graveList.length);
        delete graveReservedBy[candId];
        return candId;
    }

    function _finalizeBreed(address requester, uint256 revived) internal {
        state[revived].isInGraveyard = false;
        uint8 baseStars = meta[revived].initialStars; if (baseStars>6) baseStars=6;
        state[revived].currentStars = baseStars;

        reviveSinceLastBonus += 1;
        bool grant = false;
        if (reviveSinceLastBonus >= reviveMinGate) {
            if (reviveSinceLastBonus >= reviveMaxGate) grant = true;
            else {
                uint16 span = reviveMaxGate - uint16(reviveSinceLastBonus) + 1;
                uint256 rnd = _rnd(keccak256(abi.encode(requester, revived, reviveSinceLastBonus)));
                grant = (rnd % span) == 0;
            }
        }
        uint8 addStars = 0;
        if (grant) {
            uint256 rand = _rnd(keccak256(abi.encode(requester, revived)));
            addStars = uint8(rand % 5) + 1;
            uint8 ns = state[revived].currentStars + addStars;
            state[revived].currentStars = ns > 6 ? 6 : ns;
            reviveSinceLastBonus = 0;
        }
        state[revived].bonusStars = addStars;
        bonusBps[revived] = minPenaltyClampBps; // сразу −50%

        uint32 childCooldown = _effectiveBreedCooldown();
        if (childCooldown > 0) {
            breedUnlockAt[revived] = uint64(block.timestamp + childCooldown);
        } else {
            breedUnlockAt[revived] = 0;
        }

        if (_lastLP>0) {
            nftLP[revived].helper = address(lpHelper);
            nftLP[revived].pair   = _lastPair;
            nftLP[revived].lpAmount      += _lastLP;
            nftLP[revived].octaDeposited += _lastA;
            nftLP[revived].pairDeposited += _lastB;
            _lastLP=0; _lastA=0; _lastB=0; _lastPair=address(0);
        }

        // отдать revived NFT пользователю
        nft.transferFrom(address(this), requester, revived);
        emit BreedFinalized(requester, revived, addStars);
    }

    function _payoutLP(uint256 tokenId) internal {
        NFTLP storage L = nftLP[tokenId];
        if (L.lpAmount==0 || L.pair==address(0)) return;
        // Единый режим: удалить ликвидность, сжечь OCTA, отдать pair пользователю
    IERC20(L.pair).forceApprove(L.helper, 0);
    IERC20(L.pair).forceApprove(L.helper, L.lpAmount);
        ILPHelper(L.helper).removeLiquidityForCoreSplitToUserBurnOcta(msg.sender, L.lpAmount);
    IERC20(L.pair).forceApprove(L.helper, 0);
        // Reset LP attachment
        L.helper = address(0); L.pair = address(0);
        L.lpAmount=0; L.octaDeposited=0; L.pairDeposited=0;
    }

    // (frontend helper nftOwner(tokenId) was removed; call NFT.ownerOf directly or use Reader.nftOwner)

    // Public view: get a paginated window of graveyard IDs for UI
    function getGraveWindow(uint256 offset, uint256 maxCount) external view returns (
        uint256[] memory ids,
        uint256 total,
        uint256 cursor_,
        uint16 chunkSize
    ) {
        total = graveList.length; cursor_ = graveCursor; chunkSize = graveChunkSize;
        if (offset >= total) { ids = new uint256[](0); return (ids,total,cursor_,chunkSize); }
        uint256 end = offset + maxCount; if (end > total) end = total;
        uint256 n = end - offset; ids = new uint256[](n);
        for (uint256 i=0;i<n;i++) { ids[i] = graveList[offset + i]; }
    }

    function reconcileBalances() external onlyFund {
        uint256 bal = octa.balanceOf(address(this));
        uint256 accounted = totalLockedForRewards + monthlyRewardPool + claimReservePool;
        if (bal > accounted) { uint256 excess = bal - accounted; totalLockedForRewards += excess; }
    }


    uint256[50] private __gap;
}

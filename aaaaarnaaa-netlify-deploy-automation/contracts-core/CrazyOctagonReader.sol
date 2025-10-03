// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
Helper + Reader (в одной части), под ваш сценарий «2 контракта»:
- LP-менеджер (UniswapV2 swap/add/remove) — callable только Core.
- Reader-инспекторы для UI (view-only), читает Core через минимальный интерфейс.

Монетарные операции (approve/transfer) допускаются только от Core, через onlyCore guard.
*/

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IUniswapV2Router02 {
    function factory() external pure returns (address);
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
    function swapExactTokensForTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external returns (uint[] memory amounts);
    function addLiquidity(
        address tokenA,address tokenB,uint amountADesired,uint amountBDesired,
        uint amountAMin,uint amountBMin,address to,uint deadline
    ) external returns (uint amountA,uint amountB,uint liquidity);
    function removeLiquidity(
        address tokenA,address tokenB,uint liquidity,uint amountAMin,uint amountBMin,address to,uint deadline
    ) external returns (uint amountA,uint amountB);
}
interface IUniswapV2Factory { function getPair(address tokenA, address tokenB) external view returns (address pair); }

interface ICoreView {
    // минимальный интерфейс для ридера + расширенные геттеры для инспектора
    function octa() external view returns (address);
    function nft() external view returns (address);
    // public mappings/vars автогенерируют геттеры — объявляем здесь их сигнатуры
    function meta(uint256 tokenId) external view returns (uint8 rarity, uint8 initialStars, uint8 gender, bool isActivated);
    function state(uint256 tokenId) external view returns (
        uint48 lastPingTime,
        uint48 lastBreedTime,
        uint8 currentStars,
        uint8 bonusStars,
        bool isInGraveyard,
        uint256 lockedOcta
    );
    function bonusBps(uint256 tokenId) external view returns (int16);
    function specialBps(uint256 tokenId) external view returns (int16);
    function burns(uint256 tokenId) external view returns (
        address owner,
        uint256 totalAmount,
        uint256 claimAt,
        uint256 graveReleaseAt,
        bool claimed,
        uint32 waitMinutes
    );
    function burnSplits(uint32 waitMinutes) external view returns (uint16 playerBps, uint16 poolBps, uint16 burnBps);
    function nftLP(uint256 tokenId) external view returns (address helper, address pair, uint256 lpAmount, uint256 octaDeposited, uint256 pairDeposited);
    function totalLockedForRewards() external view returns (uint256);
    function monthlyRewardPool() external view returns (uint256);
    function claimReservePool() external view returns (uint256);
    function sharePerPing() external view returns (uint256);
    function safetyBps() external view returns (uint16);
    function sponsorBps() external view returns (uint16);
    function getBreedCosts() external view returns (uint256 octaCost, uint256 craaCost, uint256 lpFromOcta, uint256 octaToMain);
    // timing
    function pingInterval() external view returns (uint256);
    function maxAccumulation() external view returns (uint256);
    function sweepInterval() external view returns (uint256);
    function monthDuration() external view returns (uint256);
    function getGraveWindow(uint256 offset, uint256 maxCount) external view returns (
        uint256[] memory ids,
        uint256 total,
        uint256 cursor_,
        uint16 chunkSize
    );
}

contract CrazyOctagonReader {
    using SafeERC20 for IERC20;

    // Simple reentrancy guard for LP ops
    uint256 private _reentrancyLock;
    modifier nonReentrant() { require(_reentrancyLock == 0, "Reentrancy"); _reentrancyLock = 1; _; _reentrancyLock = 0; }

    address public immutable core;       // Core (контракт с логикой)
    address public immutable router;     // V2 Router
    address public immutable pairToken;  // WMON

    modifier onlyCore() { require(msg.sender==core, "NotCore"); _; }
    modifier whenNotPaused() { require(!paused && block.timestamp > pauseEnd, "Paused"); _; }

    // Timelocked pause controls
    bool public paused;                  // explicit pause flag
    uint256 public pauseEnd;             // operations blocked until this ts
    uint256 public minPauseDuration;     // minimum enforced duration; default 60 sec
    uint256 public pendingMinPauseDuration;        // new duration proposed
    uint256 public pendingMinPauseActivateAt;      // when it becomes active

    uint256 public deadlineWindow;       // seconds; 0 => fallback 1200

    event PauseSet(bool on, uint256 pauseEnd);
    event PauseDurationProposed(uint256 newSeconds, uint256 applyAt);
    event PauseDurationApplied(uint256 newSeconds);

    function setPaused(bool on) external onlyCore {
        if (on) {
            uint256 d = minPauseDuration;
            if (d == 0) d = 60; // default bootstrap
            uint256 until = block.timestamp + d;
            if (until > pauseEnd) pauseEnd = until;
            paused = true;
        } else {
            paused = false;
        }
        emit PauseSet(on, pauseEnd);
    }

    // Propose new minPauseDuration; takes effect only after current minPauseDuration window, and enforces a pause for the current window to signal change
    function setPauseDuration(uint256 seconds_) external onlyCore {
        if (minPauseDuration == 0) minPauseDuration = 60; // bootstrap if unset
        pendingMinPauseDuration = seconds_;
        // if already paused, apply only after current enforced window
        uint256 base = block.timestamp < pauseEnd ? pauseEnd : (block.timestamp + minPauseDuration);
        pendingMinPauseActivateAt = base;
        // enforce at least current window pause
        uint256 until = block.timestamp + minPauseDuration;
        if (until > pauseEnd) pauseEnd = until;
        paused = true;
        emit PauseDurationProposed(seconds_, pendingMinPauseActivateAt);
        emit PauseSet(true, pauseEnd);
    }

    function applyPendingPauseDuration() external {
        require(pendingMinPauseDuration > 0, "NoPending");
        require(block.timestamp >= pendingMinPauseActivateAt, "NotReady");
        // also ensure enforced pause window has ended
        require(block.timestamp >= pauseEnd, "PauseActive");
        minPauseDuration = pendingMinPauseDuration;
        pendingMinPauseDuration = 0;
        pendingMinPauseActivateAt = 0;
        emit PauseDurationApplied(minPauseDuration);
    }

    function setDeadlineWindow(uint256 seconds_) external onlyCore { deadlineWindow = seconds_; }

    function _deadline() internal view returns (uint256) {
        uint256 w = deadlineWindow; if (w==0) w = 1200; return block.timestamp + w;
    }

    constructor(address _core, address _router, address _pairToken) {
        require(_core!=address(0) && _router!=address(0) && _pairToken!=address(0), "bad addrs");
        core = _core; router = _router; pairToken = _pairToken;
    }

    // ===== LP-helpers (callable only by Core) =====
    function addLiquidityForCore(uint256 amountOcta, uint16 slippageBps)
        external onlyCore whenNotPaused nonReentrant returns (uint a, uint b, uint liq, address lpToken)
    {
        require(amountOcta > 0, "amountOcta=0");
        address octa = ICoreView(core).octa();
        require(octa != pairToken, "bad pair");
        IERC20(octa).safeTransferFrom(core, address(this), amountOcta);

        uint256 half  = amountOcta/2;
        uint256 other = amountOcta - half;

        address[] memory path = new address[](2);
        path[0] = octa; path[1] = pairToken;
        uint[] memory out = IUniswapV2Router02(router).getAmountsOut(other, path);
        uint minOut = out[out.length-1] * (10_000 - slippageBps) / 10_000;

        IERC20(octa).approve(router, 0);
        IERC20(octa).approve(router, other);
        IUniswapV2Router02(router).swapExactTokensForTokens(other, minOut, path, address(this), _deadline());
        IERC20(octa).approve(router, 0);

        uint256 pairBal = IERC20(pairToken).balanceOf(address(this));
        IERC20(pairToken).approve(router, 0);
        IERC20(pairToken).approve(router, pairBal);
        IERC20(octa).approve(router, 0);
        IERC20(octa).approve(router, half);

        (a,b,liq) = IUniswapV2Router02(router).addLiquidity(
            octa, pairToken,
            half, pairBal,
            (half    * (10_000 - slippageBps))/10_000,
            (pairBal * (10_000 - slippageBps))/10_000,
            core, _deadline()
        );

        IERC20(octa).approve(router, 0);
        IERC20(pairToken).approve(router, 0);

        address factory = IUniswapV2Router02(router).factory();
        lpToken = IUniswapV2Factory(factory).getPair(octa, pairToken);
    }

    

    function removeLiquidityForCoreSplitToUserBurnOcta(address to, uint256 lpAmount)
        external onlyCore whenNotPaused nonReentrant returns (uint a, uint b)
    {
        require(lpAmount > 0, "lp=0");
        address octa = ICoreView(core).octa();
        address factory = IUniswapV2Router02(router).factory();
        address lp = IUniswapV2Factory(factory).getPair(octa, pairToken);
        require(lp != address(0), "no pair");

        // Pull LP tokens from Core
        IERC20(lp).transferFrom(core, address(this), lpAmount);

        // Approve router and remove liquidity to this contract
        IERC20(lp).approve(router, 0);
        IERC20(lp).approve(router, lpAmount);
        (a,b) = IUniswapV2Router02(router).removeLiquidity(
            octa, pairToken, lpAmount, 1, 1, address(this), _deadline()
        );
        IERC20(lp).approve(router, 0);

        // Burn OCTA and send pair token to user
        if (a > 0) {
            IERC20(octa).transfer(0x000000000000000000000000000000000000dEaD, a);
        }
        if (b > 0) {
            IERC20(pairToken).transfer(to, b);
        }
    }

    // ===== View helpers for frontend (optionally extend later) =====
    function getLPParams() external view returns (address v2Router, address pair) {
        v2Router = router;
        address factory = IUniswapV2Router02(router).factory();
        pair = IUniswapV2Factory(factory).getPair(ICoreView(core).octa(), pairToken);
    }

    // Safe nftOwner: returns address(0) if ownerOf reverts (e.g., non-existent token)
    function nftOwner(address nft, uint256 tokenId) external view returns (address o) {
        // minimal interface for ownerOf
        try IERC721(nft).ownerOf(tokenId) returns (address who) { o = who; } catch { o = address(0); }
    }

    // ===== Rich inspectors =====
    function getNFTSummary(uint256 tokenId) external view returns (
        address owner,
        bool exists,
        bool activated,
        uint8 rarity,
        uint8 stars,
        uint8 bonusStars,
        bool inGraveyard,
        uint48 lastPingTime,
        uint48 lastBreedTime,
        uint256 lockedOcta,
        int16 dynBonusBps,
        int16 specBps
    ) {
        address nftAddr = ICoreView(core).nft();
        // best-effort owner
        try IERC721(nftAddr).ownerOf(tokenId) returns (address who) {
            owner = who; exists = (who != address(0));
        } catch { owner = address(0); exists = false; }

    (uint8 r, , , bool isAct) = ICoreView(core).meta(tokenId);
        (uint48 lp, uint48 lb, uint8 cur, uint8 bon, bool grave, uint256 locked) = ICoreView(core).state(tokenId);
        int16 db = ICoreView(core).bonusBps(tokenId);
        int16 sb = ICoreView(core).specialBps(tokenId);

        activated = isAct;
        rarity = r;
        stars = cur;
        bonusStars = bon;
        inGraveyard = grave;
        lastPingTime = lp;
        lastBreedTime = lb;
        lockedOcta = locked;
        dynBonusBps = db;
        specBps = sb;
    }

    function getLPInfo(uint256 tokenId) external view returns (
        address helper,
        address pair,
        uint256 lpAmount,
        uint256 octaDeposited,
        uint256 pairDeposited
    ) {
        return ICoreView(core).nftLP(tokenId);
    }

    function getBurnInfo(uint256 tokenId) external view returns (
        address owner,
        uint256 totalAmount,
        uint256 claimAt,
        uint256 graveReleaseAt,
        bool claimed,
        uint32 waitMinutes,
        uint256 playerAmount,
        uint256 poolAmount,
        uint256 burnedAmount
    ) {
        (owner,totalAmount,claimAt,graveReleaseAt,claimed,waitMinutes) = ICoreView(core).burns(tokenId);
        if (totalAmount > 0) {
            (uint16 p, uint16 pl, uint16 b) = ICoreView(core).burnSplits(waitMinutes);
            playerAmount = (totalAmount * p) / 10_000;
            poolAmount   = (totalAmount * pl) / 10_000;
            burnedAmount = (totalAmount * b) / 10_000;
        }
    }

    function getGlobalStats() external view returns (
        uint256 totalLocked,
        uint256 monthlyPool,
        uint256 claimReserve,
        uint256 sharePerPing_,
        uint16 safetyBps_
    ) {
        totalLocked   = ICoreView(core).totalLockedForRewards();
        monthlyPool   = ICoreView(core).monthlyRewardPool();
        claimReserve  = ICoreView(core).claimReservePool();
        sharePerPing_ = ICoreView(core).sharePerPing();
        safetyBps_    = ICoreView(core).safetyBps();
    }

    function getBreedQuote() external view returns (
        uint256 octaCost,
        uint256 craaCost,
        uint256 lpFromOcta,
        uint256 octaToMain,
        uint256 sponsorFee
    ) {
        (octaCost, craaCost, lpFromOcta, octaToMain) = ICoreView(core).getBreedCosts();
        uint16 sBps = ICoreView(core).sponsorBps();
        sponsorFee = (octaCost * sBps) / 10_000;
    }

    // Graveyard listing passthrough for UI
    function viewGraveWindow(uint256 offset, uint256 maxCount) external view returns (
        uint256[] memory ids,
        uint256 total,
        uint256 cursor_,
        uint16 chunkSize
    ) {
        return ICoreView(core).getGraveWindow(offset, maxCount);
    }

    // Global timing parameters for Ping/Rewards pages
    function getPingTiming() external view returns (
        uint256 pingInterval_,
        uint256 maxAccumulation_,
        uint256 sweepInterval_,
        uint256 monthDuration_
    ) {
        pingInterval_    = ICoreView(core).pingInterval();
        maxAccumulation_ = ICoreView(core).maxAccumulation();
        sweepInterval_   = ICoreView(core).sweepInterval();
        monthDuration_   = ICoreView(core).monthDuration();
    }

    // Reader pause/deadline state for UI
    function getPauseStatus() external view returns (
        bool paused_,
        uint256 pauseEnd_,
        uint256 minPauseDuration_,
        uint256 deadlineWindow_
    ) {
        paused_ = paused;
        pauseEnd_ = pauseEnd;
        minPauseDuration_ = minPauseDuration;
        deadlineWindow_ = deadlineWindow;
    }
}

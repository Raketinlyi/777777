import { rarityLabels } from './rarity';

export const RARITY_BASE_STARS = [1, 2, 3, 4, 5, 6] as const;

const clampIndex = (value: number): number =>
  Math.max(0, Math.min(RARITY_BASE_STARS.length - 1, Math.floor(value)));

const LABEL_INDEX_MAP = rarityLabels
  .slice(1)
  .reduce<Record<string, number>>((acc, label, idx) => {
    acc[label.toLowerCase()] = idx;
    return acc;
  }, {});

export const rarityIndexByLabel: Record<string, number> = LABEL_INDEX_MAP;

export const clampRarityIndex = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return clampIndex(numeric);
};

export const getStarsFromIndex = (index: unknown): number => {
  const numeric = Number(index);
  if (!Number.isFinite(numeric)) {
    return RARITY_BASE_STARS[0];
  }
  return RARITY_BASE_STARS[clampIndex(numeric)] ?? RARITY_BASE_STARS[0];
};

export const starCountToIndex = (stars: unknown): number => {
  const count = normalizeStars(stars);
  if (count <= 0) return 0;
  return clampIndex(count - 1);
};

export const getBaseStarsForRarity = (rarity: unknown): number => {
  if (typeof rarity === 'number') {
    const numeric = normalizeStars(rarity);
    if (numeric <= 0) {
      return RARITY_BASE_STARS[0];
    }
    if (numeric <= RARITY_BASE_STARS.length) {
      return numeric;
    }
    return getStarsFromIndex(numeric);
  }
  if (typeof rarity === 'string') {
    const idx = LABEL_INDEX_MAP[rarity.toLowerCase()] ?? 0;
    return getStarsFromIndex(idx);
  }
  const idx = clampRarityIndex(rarity);
  return getStarsFromIndex(idx);
};

export const normalizeStars = (value: unknown): number => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.floor(numeric));
};

export interface StarState {
  totalBase: number;
  bonusSlots: number;
  totalCapacity: number;
  activeBase: number;
  activeBonus: number;
  totalActive: number;
  burnedBase: number;
  inactiveBonus: number;
}

export const computeStarState = ({
  baseStars,
  bonusStars = 0,
  currentStars,
}: {
  baseStars: number;
  bonusStars?: number;
  currentStars: number;
}): StarState => {
  const safeBase = normalizeStars(baseStars);
  const safeBonus = normalizeStars(bonusStars);
  const safeCurrent = normalizeStars(currentStars);

  const capacity = safeBase + safeBonus;
  const totalActive = Math.min(safeCurrent, capacity);
  const activeBase = Math.min(totalActive, safeBase);
  const activeBonus = totalActive - activeBase;
  const burnedBase = Math.max(0, safeBase - activeBase);
  const inactiveBonus = Math.max(0, safeBonus - activeBonus);

  return {
    totalBase: safeBase,
    bonusSlots: safeBonus,
    totalCapacity: capacity,
    activeBase,
    activeBonus,
    totalActive,
    burnedBase,
    inactiveBonus,
  };
};

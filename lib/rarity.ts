// Rarity labels (1-based index matching contract: 1=Common, 2=Uncommon, ..., 6=Mythic)
export const rarityLabels = [
  'Unknown', // 0 - unused by contract
  'Common',    // 1
  'Uncommon',  // 2
  'Rare',      // 3
  'Epic',      // 4
  'Legendary', // 5
  'Mythic',    // 6
] as const;

export const rarityColors = [
  '', // 0 unused
  'bg-gray-500', // 1 Common
  'bg-green-500', // 2 Uncommon
  'bg-blue-500', // 3 Rare
  'bg-purple-500', // 4 Epic
  'bg-orange-500', // 5 Legendary
  'bg-red-500', // 6 Mythic
] as const;

export function getRarityLabel(starsOrCode: number) {
  const idx = Math.max(1, Math.min(6, starsOrCode));
  return rarityLabels[idx];
}

export function getRarityColor(starsOrCode: number) {
  const idx = Math.max(1, Math.min(6, starsOrCode));
  return rarityColors[idx];
}

export function labelToIndex(label: string) {
  // Защита от undefined/null
  if (!label || typeof label !== 'string') {
    return 1; // Default to Common
  }
  const idx = rarityLabels.findIndex(
    l => l && l.toLowerCase() === label.toLowerCase()
  );
  return idx > 0 ? idx : 1;
}

// Overloads to accept string label or number
export function getColor(value: number | string | undefined) {
  // Защита от undefined/null
  if (value === undefined || value === null) {
    return getRarityColor(1); // Default to Common
  }
  const idx = typeof value === 'number' ? value : labelToIndex(value);
  return getRarityColor(idx);
}

export function getLabel(value: number | string | undefined) {
  // Защита от undefined/null
  if (value === undefined || value === null) {
    return getRarityLabel(1); // Default to Common
  }
  return typeof value === 'number'
    ? getRarityLabel(value)
    : getRarityLabel(labelToIndex(value));
}

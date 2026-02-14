export const ADULT_TOOTH_COUNT_PER_JAW = 16;
export const ADULT_TOTAL_TOOTH_COUNT = ADULT_TOOTH_COUNT_PER_JAW * 2;

const scaleAdultUpperTop = (originalTopPct: number) => {
  const srcMax = 85;
  const dstMin = 4;
  const dstMax = 46;
  const ratio = (dstMax - dstMin) / srcMax;
  return dstMin + originalTopPct * ratio;
};

export const getAdultDisplayNumber = (toothIndex: number): number => {
  if (toothIndex <= ADULT_TOOTH_COUNT_PER_JAW) {
    if (toothIndex <= ADULT_TOOTH_COUNT_PER_JAW / 2) {
      return 18 - (toothIndex - 1);
    }
    return 20 + (toothIndex - ADULT_TOOTH_COUNT_PER_JAW / 2);
  }

  const mirrored = (ADULT_TOTAL_TOOTH_COUNT + 1) - toothIndex;
  if (mirrored <= ADULT_TOOTH_COUNT_PER_JAW / 2) {
    return 48 - (mirrored - 1);
  }
  return 30 + (mirrored - ADULT_TOOTH_COUNT_PER_JAW / 2);
};

export const getChildDisplayNumber = (toothIndex: number): number => {
  const childUpperStart = ADULT_TOTAL_TOOTH_COUNT + 1;
  if (toothIndex < childUpperStart) return getAdultDisplayNumber(toothIndex);

  const offset = toothIndex - childUpperStart;
  if (offset < 10) {
    if (offset < 5) {
      return 55 - offset;
    }
    return 61 + (offset - 5);
  }
  const lowerOffset = offset - 10;
  if (lowerOffset < 5) {
    return 85 - lowerOffset;
  }
  return 71 + (lowerOffset - 5);
};

const adultFdiToIndex = new Map<number, number>();
for (let i = 1; i <= ADULT_TOTAL_TOOTH_COUNT; i += 1) {
  adultFdiToIndex.set(getAdultDisplayNumber(i), i);
}

const childFdiSequence = [
  55, 54, 53, 52, 51,
  61, 62, 63, 64, 65,
  85, 84, 83, 82, 81,
  71, 72, 73, 74, 75,
];

const fdiToIndex = new Map<number, number>(adultFdiToIndex);
childFdiSequence.forEach((fd, idx) => {
  fdiToIndex.set(fd, ADULT_TOTAL_TOOTH_COUNT + idx + 1);
});

export const normalizeToothNumber = (fdibValue: number | null | undefined): number | null => {
  if (typeof fdibValue !== 'number') return null;
  const normalized = fdiToIndex.get(fdibValue);
  if (normalized) return normalized;
  if (fdibValue >= 1 && fdibValue <= ADULT_TOTAL_TOOTH_COUNT + childFdiSequence.length) {
    return fdibValue;
  }
  return null;
};

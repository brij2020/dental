// src/components/DentalChart/ChildDentalChart.tsx
import React from 'react';
import './DentalChart.css';

import {
  CHILD_SVG_BY_INDEX,
  CHILD_UPPER_POSITIONS,
  CHILD_TOOTH_COUNT_PER_JAW,
  CHILD_UPPER_NUMBER_POSITIONS,
  CHILD_LOWER_NUMBER_POSITIONS,
} from './childTeeth';

const TOTAL_TEETH = CHILD_TOOTH_COUNT_PER_JAW * 2;
const QUADRANT_CHILD = CHILD_TOOTH_COUNT_PER_JAW / 2; // typically 5

// NEW: map internal index -> FDI label for CHILD
const getChildDisplayNumber = (toothNumber: number): number => {
  if (toothNumber <= CHILD_TOOTH_COUNT_PER_JAW) {
    // UPPER
    const idx = toothNumber; // 1..10
    if (idx <= QUADRANT_CHILD) {
      // 1..5 -> 55..51
      return 55 - (idx - 1);
    } else {
      // 6..10 -> 61..65
      return 60 + (idx - QUADRANT_CHILD);
    }
  } else {
    // LOWER (mirror upper)
    const upperIndex = (TOTAL_TEETH + 1) - toothNumber; // 10..1
    if (upperIndex <= QUADRANT_CHILD) {
      // 1..5 -> 85..81
      return 85 - (upperIndex - 1);
    } else {
      // 6..10 -> 71..75
      return 70 + (upperIndex - QUADRANT_CHILD);
    }
  }
};


type ChildDentalChartProps = {
  onToothClick?: (toothNumber: number) => void;
};

const parseDeg = (t: string) => {
  const m = t?.match(/rotate\((-?\d+)deg\)/);
  return m ? parseInt(m[1], 10) : 0;
};

const pctNum = (v: string | number | undefined) =>
  typeof v === 'string' && v.endsWith('%') ? parseFloat(v) : (typeof v === 'number' ? v : 0);


const scaleUpperTopChild = (originalTopPct: number) => {
  const srcMax = 85;
  const dstMin = 18;
  const dstMax = 42;
  const ratio = (dstMax - dstMin) / srcMax;
  return dstMin + originalTopPct * ratio;
};

const normalizedUpperPositions: Record<number, React.CSSProperties> = (() => {
  const result: Record<number, React.CSSProperties> = {};
  for (let tooth = 1; tooth <= CHILD_TOOTH_COUNT_PER_JAW; tooth++) {
    const s = CHILD_UPPER_POSITIONS[tooth];
    const topPct = scaleUpperTopChild(pctNum(s.top));
    result[tooth] = { ...s, top: `${topPct}%` };
  }
  return result;
})();


const lowerToothPositions: Record<number, React.CSSProperties> = (() => {
  const result: Record<number, React.CSSProperties> = {};
  for (let tooth = CHILD_TOOTH_COUNT_PER_JAW + 1; tooth <= TOTAL_TEETH; tooth++) {
    const upperIndex = (TOTAL_TEETH + 1) - tooth; // mirrors 11→10 … 20→1
    const s = normalizedUpperPositions[upperIndex];
    const topPctUpper = pctNum(s.top);
    const topPctLower = 100 - topPctUpper;
    const angle = parseDeg(s.transform as string);
    const mirroredAngle = angle + 0;

    result[tooth] = {
      left: s.left,
      top: `${topPctLower}%`,
      transform: `translate(-50%, -50%) rotate(${mirroredAngle}deg)`,
    };
  }
  return result;
})();

const upperTeeth = Array.from({ length: CHILD_TOOTH_COUNT_PER_JAW }, (_, i) => i + 1);
const lowerTeeth = Array.from(
  { length: CHILD_TOOTH_COUNT_PER_JAW },
  (_, i) => CHILD_TOOTH_COUNT_PER_JAW + i + 1
);

const ChildDentalChart: React.FC<ChildDentalChartProps> = ({ onToothClick }) => {
  const getSvgForTooth = (toothNumber: number) => {
    const upperIndex =
      toothNumber <= CHILD_TOOTH_COUNT_PER_JAW
        ? toothNumber
        : (TOTAL_TEETH + 1) - toothNumber;
    return CHILD_SVG_BY_INDEX[upperIndex];
  };

  const getPositionForTooth = (toothNumber: number) =>
    toothNumber <= CHILD_TOOTH_COUNT_PER_JAW
      ? normalizedUpperPositions[toothNumber]
      : lowerToothPositions[toothNumber];

   const renderTooth = (toothNumber: number) => {
    const svgSrc = getSvgForTooth(toothNumber);
    const positionStyle = getPositionForTooth(toothNumber);
    if (!svgSrc) return null;

    const isLower = toothNumber > CHILD_TOOTH_COUNT_PER_JAW;

    return (
      <div
        className="tooth-item"
        style={positionStyle}
        key={`child-${toothNumber}`}
        onClick={() => onToothClick?.(getChildDisplayNumber(toothNumber))}
      >
        <img
          src={svgSrc}
          alt="Tooth"
          className={`tooth-image tooth-image--child ${isLower ? 'tooth-image--flipped' : ''}`}
        />
      </div>
    );
  };

  return (
    <>
      {upperTeeth.map(renderTooth)}
      {lowerTeeth.map(renderTooth)}

      {/* child number labels */}
      {Object.entries(CHILD_UPPER_NUMBER_POSITIONS).map(([num, style]) => (
        <div key={`child-number-${num}`} className="tooth-number" style={style}>
          {num}
        </div>
      ))}
      {Object.entries(CHILD_LOWER_NUMBER_POSITIONS).map(([num, style]) => (
        <div key={`child-number-${num}`} className="tooth-number" style={style}>
          {num}
        </div>
      ))}
    </>
  );
};

export default ChildDentalChart;
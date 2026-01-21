// src/components/DentalChart/DentalChart.tsx
import React from 'react';
import './DentalChart.css';
import ToothDamageModal from './ToothDamageModal';
import ChildDentalChart from './ChildDentalChart';
import {
  ADULT_SVG_BY_INDEX,
  ADULT_UPPER_POSITIONS,
  ADULT_TOOTH_COUNT_PER_JAW,
    ADULT_UPPER_NUMBER_POSITIONS,
  ADULT_LOWER_NUMBER_POSITIONS,
} from './adultTeeth';

const TOTAL_ADULT = ADULT_TOOTH_COUNT_PER_JAW * 2;
const QUADRANT_ADULT = ADULT_TOOTH_COUNT_PER_JAW / 2; // typically 8

// NEW: map internal index -> FDI label for ADULT
const getAdultDisplayNumber = (toothNumber: number): number => {
  if (toothNumber <= ADULT_TOOTH_COUNT_PER_JAW) {
    // UPPER
    const idx = toothNumber; // 1..16
    if (idx <= QUADRANT_ADULT) {
      // 1..8 -> 18..11
      return 18 - (idx - 1);
    } else {
      // 9..16 -> 21..28
      return 20 + (idx - QUADRANT_ADULT);
    }
  } else {
    // LOWER – reuse your mirror math
    const upperIndex = (TOTAL_ADULT + 1) - toothNumber; // 16..1
    if (upperIndex <= QUADRANT_ADULT) {
      // 1..8 -> 48..41
      return 48 - (upperIndex - 1);
    } else {
      // 9..16 -> 31..38
      return 30 + (upperIndex - QUADRANT_ADULT);
    }
  }
};

const parseDeg = (t: string) => {
  const m = t?.match(/rotate\((-?\d+)deg\)/);
  return m ? parseInt(m[1], 10) : 0;
};
const pctNum = (v: string | number | undefined) =>
  typeof v === 'string' && v.endsWith('%') ? parseFloat(v) : (typeof v === 'number' ? v : 0);

// Adult normalization (outer arc)
const scaleUpperTopAdult = (originalTopPct: number) => {
  const srcMax = 85, dstMin = 4, dstMax = 46;
  const ratio = (dstMax - dstMin) / srcMax;
  return dstMin + originalTopPct * ratio;
};

const normalizedUpperPositionsAdult: Record<number, React.CSSProperties> = (() => {
  const result: Record<number, React.CSSProperties> = {};
  for (let tooth = 1; tooth <= ADULT_TOOTH_COUNT_PER_JAW; tooth++) {
    const s = ADULT_UPPER_POSITIONS[tooth];
    const topPct = scaleUpperTopAdult(pctNum(s.top));
    result[tooth] = { ...s, top: `${topPct}%` };
  }
  return result;
})();


const lowerToothPositionsAdult: Record<number, React.CSSProperties> = (() => {
  const result: Record<number, React.CSSProperties> = {};
  for (let tooth = ADULT_TOOTH_COUNT_PER_JAW + 1; tooth <= TOTAL_ADULT; tooth++) {
    const upperIndex = (TOTAL_ADULT + 1) - tooth;
    const s = normalizedUpperPositionsAdult[upperIndex];
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

const AdultDentalLayer: React.FC<{ onToothClick?: (toothNumber: number) => void }> = ({ onToothClick }) => {
  const upperTeeth = Array.from({ length: ADULT_TOOTH_COUNT_PER_JAW }, (_, i) => i + 1);
  const lowerTeeth = Array.from({ length: ADULT_TOOTH_COUNT_PER_JAW }, (_, i) => TOTAL_ADULT - i);

  const getSvgForTooth = (toothNumber: number) => {
    const upperIndex =
      toothNumber <= ADULT_TOOTH_COUNT_PER_JAW
        ? toothNumber
        : (TOTAL_ADULT + 1) - toothNumber;
    return ADULT_SVG_BY_INDEX[upperIndex];
  };

  const getPositionForTooth = (toothNumber: number) =>
    toothNumber <= ADULT_TOOTH_COUNT_PER_JAW
      ? normalizedUpperPositionsAdult[toothNumber]
      : lowerToothPositionsAdult[toothNumber];

  const renderTooth = (toothNumber: number) => {
    const svgSrc = getSvgForTooth(toothNumber);
    const positionStyle = getPositionForTooth(toothNumber);
    if (!svgSrc) return null;
    const isLower = toothNumber > ADULT_TOOTH_COUNT_PER_JAW;

    return (
      <div
        className="tooth-item"
        style={positionStyle}
        key={`adult-${toothNumber}`}
        onClick={() => onToothClick?.(toothNumber)}
      >
        <img
          src={svgSrc}
          alt="Tooth"
          className={`tooth-image ${isLower ? 'tooth-image--flipped' : ''}`}
        />
      </div>
    );
  };

  return (
    <>
      {upperTeeth.map(renderTooth)}
      {lowerTeeth.map(renderTooth)}

      {/* number labels */}
      {Object.entries(ADULT_UPPER_NUMBER_POSITIONS).map(([num, style]) => (
        <div key={`adult-number-${num}`} className="tooth-number" style={style}>
          {num}
        </div>
      ))}
      {Object.entries(ADULT_LOWER_NUMBER_POSITIONS).map(([num, style]) => (
        <div key={`adult-number-${num}`} className="tooth-number" style={style}>
          {num}
        </div>
      ))}
    </>
  );
};

// --- UPDATED: Add Props ---
type DentalChartProps = {
  consultationId: string;
  clinicId: string;
};

const DentalChart: React.FC<DentalChartProps> = ({ consultationId, clinicId }) => {
  const [isDamageOpen, setDamageOpen] = React.useState(false);
  const [selectedToothDisplay, setSelectedToothDisplay] = React.useState<number | null>(null);

  // NEW: separate handlers so we can map adult vs child differently
  const handleAdultToothClick = (internalIndex: number) => {
    setSelectedToothDisplay(getAdultDisplayNumber(internalIndex));
    setDamageOpen(true);
  };

  const handleChildToothClick = (internalIndex: number) => {
    // delegate mapping to Child component’s scheme via the same idea (see below)
    // We’ll pass back already-mapped number from the child chart:
    setSelectedToothDisplay(internalIndex); // will actually be the child FDI number
    setDamageOpen(true);
  };

  return (
    <div className="dental-chart-container">
      <div className="dental-arch-container">
        <AdultDentalLayer onToothClick={handleAdultToothClick} />
        <ChildDentalChart onToothClick={handleChildToothClick} />
      </div>

      {/* --- UPDATED: Pass new props to Modal --- */}
      <ToothDamageModal
        isOpen={isDamageOpen}
        toothNumber={selectedToothDisplay}
        onClose={() => setDamageOpen(false)}
        // Pass the required IDs
        consultationId={consultationId}
        clinicId={clinicId}
        // Renamed onSave to onSaveSuccess
        onSaveSuccess={() => {
          console.log('Tooth damage saved!');
          setDamageOpen(false);
          // Here you could also trigger a refetch of procedures
          // for the main Procedure.tsx component, e.g., using a
          // context or state management library.
        }}
      />
    </div>
  );
};

export default DentalChart;
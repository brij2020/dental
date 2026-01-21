// src/components/DentalChart/childTeeth.ts
import type { CSSProperties } from 'react';

import c1 from '../../../../assets/childTeeth/1.svg';
import c2 from '../../../../assets/childTeeth/2.svg';
import c3 from '../../../../assets/childTeeth/3.svg';
import c4 from '../../../../assets/childTeeth/4.svg';
import c5 from '../../../../assets/childTeeth/5.svg';
import c6 from '../../../../assets/childTeeth/6.svg';
import c7 from '../../../../assets/childTeeth/7.svg';
import c8 from '../../../../assets/childTeeth/8.svg';
import c9 from '../../../../assets/childTeeth/9.svg';
import c10 from '../../../../assets/childTeeth/10.svg';

export const CHILD_TOOTH_COUNT_PER_JAW = 10;

export const CHILD_SVG_BY_INDEX: Record<number, string> = {
  1: c1, 2: c2, 3: c3, 4: c4, 5: c5,
  6: c6, 7: c7, 8: c8, 9: c9, 10: c10,
};

export const CHILD_UPPER_POSITIONS: Record<number, CSSProperties> = {
  1:  { top: '11%', left: '33%',  transform: 'translate(-50%, -50%)' },
  2:  { top: '-24%',    left: '35%',  transform: 'translate(-50%, -50%)' },
  3:  { top: '-56.4%', left: '37.6%', transform: 'translate(-50%, -50%)' },
  4:  { top: '-79%',   left: '41.7%', transform: 'translate(-50%, -50%)' },
  5:  { top: '-90%',   left: '47%',   transform: 'translate(-50%, -50%)' },
  6:  { top: '-90%',   left: '52.8%',   transform: 'translate(-50%, -50%)' },
  7:  { top: '-79%',   left: '58.1%', transform: 'translate(-50%, -50%)' },
  8:  { top: '-56.4%', left: '62.2%',   transform: 'translate(-50%, -50%)' },
  9:  { top: '-24%',     left: '65%',   transform: 'translate(-50%, -50%)' },
  10: { top: '11%',  left: '67%',   transform: 'translate(-50%, -50%)' },
};


export const CHILD_UPPER_NUMBER_POSITIONS: Record<number, React.CSSProperties> = {
55:  { top: '27%', left: '37%',  transform: 'translate(-50%, -50%)' },
54:  { top: '18%', left: '39%',  transform: 'translate(-50%, -50%)' },
53:  { top: '9%', left: '41%',  transform: 'translate(-50%, -50%)' },
  52:  { top: '4%', left: '44%',  transform: 'translate(-50%, -50%)' },
  51:  { top: '2%', left: '47.5%',  transform: 'translate(-50%, -50%)' },
  61:  { top: '2%', left: '51.7%',  transform: 'translate(-50%, -50%)' },
  62:  { top: '4%', left: '55.6%',  transform: 'translate(-50%, -50%)' },
  63:  { top: '9%', left: '58%',  transform: 'translate(-50%, -50%)' },
  64:  { top: '18%', left: '60.4%',  transform: 'translate(-50%, -50%)' },
  65:  { top: '27%', left: '62.5%',  transform: 'translate(-50%, -50%)' },
  
};

export const CHILD_LOWER_NUMBER_POSITIONS: Record<number, React.CSSProperties> = {
  85: { top: '72%', left: '37%', transform: 'translate(-50%, -50%)' },
  84: { top: '82%', left: '39%', transform: 'translate(-50%, -50%)' },
  83: { top: '90.5%', left: '41.4%', transform: 'translate(-50%, -50%)' },
  82: { top: '95%', left: '44%', transform: 'translate(-50%, -50%)' },
  81: { top: '98%', left: '48%', transform: 'translate(-50%, -50%)' },
  71: { top: '98%', left: '52%', transform: 'translate(-50%, -50%)' },
  72: { top: '96%', left: '55.5%', transform: 'translate(-50%, -50%)' },
  73: { top: '91%', left: '58.4%', transform: 'translate(-50%, -50%)' },
  74: { top: '82%', left: '61%', transform: 'translate(-50%, -50%)' },
  75: { top: '72%', left: '63%', transform: 'translate(-50%, -50%)' },

};
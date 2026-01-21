import type { CSSProperties } from 'react';

import tooth1Svg from '../../../../assets/adultTeeth/1.svg';
import tooth2Svg from '../../../../assets/adultTeeth/2.svg';
import tooth3Svg from '../../../../assets/adultTeeth/3.svg';
import tooth4Svg from '../../../../assets/adultTeeth/4.svg';
import tooth5Svg from '../../../../assets/adultTeeth/5.svg';
import tooth6Svg from '../../../../assets/adultTeeth/6.svg';
import tooth7Svg from '../../../../assets/adultTeeth/7.svg';
import tooth8Svg from '../../../../assets/adultTeeth/8.svg';
import tooth9Svg from '../../../../assets/adultTeeth/9.svg';
import tooth10Svg from '../../../../assets/adultTeeth/10.svg';
import tooth11Svg from '../../../../assets/adultTeeth/11.svg';
import tooth12Svg from '../../../../assets/adultTeeth/12.svg';
import tooth13Svg from '../../../../assets/adultTeeth/13.svg';
import tooth14Svg from '../../../../assets/adultTeeth/14.svg';
import tooth15Svg from '../../../../assets/adultTeeth/15.svg';
import tooth16Svg from '../../../../assets/adultTeeth/16.svg';

export const ADULT_TOOTH_COUNT_PER_JAW = 16;

export const ADULT_SVG_BY_INDEX: Record<number, string> = {
  1: tooth1Svg,  2: tooth2Svg,  3: tooth3Svg,  4: tooth4Svg,
  5: tooth5Svg,  6: tooth6Svg,  7: tooth7Svg,  8: tooth8Svg,
  9: tooth9Svg, 10: tooth10Svg, 11: tooth11Svg, 12: tooth12Svg,
 13: tooth13Svg, 14: tooth14Svg, 15: tooth15Svg, 16: tooth16Svg,
};

export const ADULT_UPPER_POSITIONS: Record<number, CSSProperties> = {
  1:  { top: '55.2%', left: '20%',  transform: 'translate(-50%, -50%) ' },
  2:  { top: '28.3%', left: '21%',  transform: 'translate(-50%, -50%)' },
  3:  { top: '2%', left: '23.8%', transform: 'translate(-50%, -50%)' },
  4:  { top: '-23.7%', left: '26%', transform: 'translate(-50%, -50%)' },
  5:  { top: '-46.3%', left: '30%', transform: 'translate(-50%, -50%)' },
  6:  { top: '-66%',  left: '34.3%', transform: 'translate(-50%, -50%)' },
  7:  { top: '-83%',  left: '39.4%', transform: 'translate(-50%, -50%)' },
  8:  { top: '-90%',  left: '46%', transform: 'translate(-50%, -50%)'  },
  9:  { top: '-90%',  left: '53%', transform: 'translate(-50%, -50%)'   },
  10: { top: '-83%',  left: '59.6%', transform: 'translate(-50%, -50%) '  },
  11: { top: '-66%',  left: '64.6%', transform: 'translate(-50%, -50%) '  },
  12: { top: '-46.3%', left: '69%', transform: 'translate(-50%, -50%) '  },
  13: { top: '-23.7%', left: '73%', transform: 'translate(-50%, -50%)'  },
  14: { top: '2%', left: '75%', transform: 'translate(-50%, -50%)'  },
  15: { top: '28.3%', left: '77%', transform: 'translate(-50%, -50%) '  },
  16: { top: '55.2%', left: '78%', transform: 'translate(-50%, -50%)'  },
};

export const ADULT_UPPER_NUMBER_POSITIONS: Record<number, CSSProperties> = {
18:  { top: '30%', left: '14%',  transform: 'translate(-50%, -50%) ' },
  17:  { top: '16%', left: '15%',  transform: 'translate(-50%, -50%)' },
  16:  { top: '3%', left: '17.4%', transform: 'translate(-50%, -50%)' },
  15:  { top: '-11%', left: '20.4%', transform: 'translate(-50%, -50%)' },
  14:  { top: '-24%', left: '25%', transform: 'translate(-50%, -50%)' },
  13:  { top: '-38%',  left: '31%', transform: 'translate(-50%, -50%)' },
  12:  { top: '-47%',  left: '37.5%', transform: 'translate(-50%, -50%)' },
  11:  { top: '-52%',  left: '45%', transform: 'translate(-50%, -50%)'  },
  21:  { top: '-52%',  left: '53%', transform: 'translate(-50%, -50%)'   },
  22: { top: '-48%',  left: '61.1%', transform: 'translate(-50%, -50%) '  },
  23: { top: '-37%',  left: '69%', transform: 'translate(-50%, -50%) '  },
24: { top: '-25%', left: '74%', transform: 'translate(-50%, -50%) '  },
  25: { top: '-12%', left: '79%', transform: 'translate(-50%, -50%)'  },
  26: { top: '2%', left: '81%', transform: 'translate(-50%, -50%)'  },
  27: { top: '16%', left: '83.5%', transform: 'translate(-50%, -50%) '  },
  28: { top: '29%', left: '85%', transform: 'translate(-50%, -50%)'  },
};

// Same for lower jaw
export const ADULT_LOWER_NUMBER_POSITIONS: Record<number, CSSProperties> = {
  48: { top: '68%', left: '14%', transform: 'translate(-50%, -50%)' },
  47: { top: '83%', left: '15%', transform: 'translate(-50%, -50%)' },
  46: { top: '97%', left: '18%', transform: 'translate(-50%, -50%)' },
  45: { top: '110%', left: '20.4%', transform: 'translate(-50%, -50%)' },
  44: { top: '122%', left: '24%', transform: 'translate(-50%, -50%)' },
  43: { top: '135%', left: '29.5%', transform: 'translate(-50%, -50%)' },
  42: { top: '147%', left: '37%', transform: 'translate(-50%, -50%)' },
  41: { top: '152%', left: '46%', transform: 'translate(-50%, -50%)' },
    31: { top: '152%', left: '53.5%', transform: 'translate(-50%, -50%)' },
    32: { top: '147%', left: '62%', transform: 'translate(-50%, -50%)' },
    33: { top: '138%', left: '68%', transform: 'translate(-50%, -50%)' },
    34: { top: '125%', left: '73.5%', transform: 'translate(-50%, -50%)' },
    35: { top: '113%', left: '78%', transform: 'translate(-50%, -50%)' },
    36: { top: '99%', left: '80.5%', transform: 'translate(-50%, -50%)' },
    37: { top: '83%', left: '83%', transform: 'translate(-50%, -50%)' },
    38: { top: '69%', left: '84%', transform: 'translate(-50%, -50%)' },
};
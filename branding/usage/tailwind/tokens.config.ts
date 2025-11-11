// Tailwind theme extension for Calibrate
import type { Config } from 'tailwindcss';

export default {
  theme: {
    extend: {
      colors: {
        cb: {
          blue100: '#67C8FF',
          blue500: '#377BFF',
          blue800: '#0E3AFF',
          navy: '#001845',
          bg: '#F8FAFF',
        },
      },
      gradientColorStops: {
        'cb-start': '#67C8FF',
        'cb-mid': '#377BFF',
        'cb-end': '#0E3AFF',
      },
    },
  },
} satisfies Partial<Config>;

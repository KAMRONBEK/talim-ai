import type { Config } from 'tailwindcss';
import talimPreset from '@talim/tailwind-config/tailwind.config';

const config: Config = {
  presets: [talimPreset],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/components/**/*.{ts,tsx}',
  ],
};

export default config;

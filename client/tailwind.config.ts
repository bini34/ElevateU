import flowbite from 'flowbite-react/tailwind';

import type { Config } from "tailwindcss";

const config: Config = {
  // Finite component variants are composed in TSX; preserve their layer rules.
  safelist: [
    ...['primary', 'secondary', 'outline', 'ghost', 'danger', 'sm', 'md', 'lg'].map((name) => `ui-button-${name}`),
    ...['default', 'muted', 'mint', 'blue', 'yellow', 'peach', 'lavender', 'pink'].map((name) => `ui-surface-${name}`),
    ...['neutral', 'success', 'warning', 'danger', 'info'].map((name) => `ui-badge-${name}`),
    ...['checkbox', 'radio', 'switch'].map((name) => `ui-choice-${name}`),
    ...['completed', 'missed', 'upcoming', 'today'].map((name) => `ui-streak-day-${name}`),
    ...['sm', 'md', 'lg', 'xl'].map((name) => `ui-avatar-${name}`),
  ],
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    flowbite.content()

  ],
  theme: {
    extend: {
      colors: {
        ...Object.fromEntries([
          'background', 'foreground', 'surface', 'surface-muted', 'surface-elevated',
          'text-muted', 'border', 'border-control', 'border-strong', 'primary', 'primary-hover',
          'primary-soft', 'primary-foreground', 'focus', 'success', 'success-soft', 'warning',
          'warning-soft', 'danger', 'danger-soft', 'info', 'info-soft', 'on-solid',
          'pastel-mint', 'pastel-blue', 'pastel-yellow', 'pastel-peach', 'pastel-lavender', 'pastel-pink',
        ].map((name) => [name, `rgb(var(--${name}) / <alpha-value>)`])),
      },
      fontFamily: { sans: ['var(--font-geist-sans)', 'Arial', 'sans-serif'] },
      fontSize: {
        display: ['var(--type-display)', { lineHeight: '1.12', letterSpacing: '-.045em', fontWeight: '650' }],
        h1: ['var(--type-h1)', { lineHeight: '1.2', letterSpacing: '-.035em', fontWeight: '650' }],
        h2: ['var(--type-h2)', { lineHeight: '1.3', letterSpacing: '-.025em', fontWeight: '600' }],
        h3: ['var(--type-h3)', { lineHeight: '1.4', letterSpacing: '-.015em', fontWeight: '600' }],
        h4: ['var(--type-h4)', { lineHeight: '1.5', fontWeight: '600' }],
        body: ['var(--type-body)', { lineHeight: '1.65' }],
        'body-small': ['var(--type-small)', { lineHeight: '1.6' }],
        label: ['var(--type-label)', { lineHeight: '1.4', fontWeight: '600' }],
        caption: ['var(--type-caption)', { lineHeight: '1.5' }],
        metadata: ['var(--type-metadata)', { lineHeight: '1.5', fontWeight: '500' }],
      },
      borderRadius: {
        control: 'var(--radius-sm)', button: 'var(--radius-md)', card: 'var(--radius-lg)',
        panel: 'var(--radius-panel)', shell: 'var(--radius-shell)',
      },
      boxShadow: { xs: 'var(--shadow-xs)', sm: 'var(--shadow-sm)', panel: 'var(--shadow-panel)' },
    },
  },
  plugins: [
    flowbite.plugin(),
  ],
};
export default config;

---
name: Atmospheric Intelligence
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c6c6ca'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#8f9195'
  outline-variant: '#45474a'
  surface-tint: '#c5c6cb'
  primary: '#c5c6cb'
  on-primary: '#2e3134'
  primary-container: '#05070a'
  on-primary-container: '#76787d'
  inverse-primary: '#5c5e63'
  secondary: '#ddfcff'
  on-secondary: '#00363a'
  secondary-container: '#00f1fe'
  on-secondary-container: '#006a70'
  tertiary: '#43d8f2'
  on-tertiary: '#00363e'
  tertiary-container: '#00080b'
  on-tertiary-container: '#008496'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e2e7'
  primary-fixed-dim: '#c5c6cb'
  on-primary-fixed: '#191c1f'
  on-primary-fixed-variant: '#44474b'
  secondary-fixed: '#74f5ff'
  secondary-fixed-dim: '#00dbe7'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#a2eeff'
  tertiary-fixed-dim: '#43d8f2'
  on-tertiary-fixed: '#001f25'
  on-tertiary-fixed-variant: '#004e5a'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 16px
  margin-desktop: 32px
  gutter: 16px
  sidebar-width: 320px
  top-bar-height: 64px
---

## Brand & Style
The design system is engineered for BioScan, an environmental monitoring platform that balances scientific rigor with an urgent call to action. The brand personality is authoritative and transparent, designed to make complex planetary data feel both accessible and high-stakes.

The visual style follows an **Immersive Dark Mode** approach. It leverages deep obsidian backgrounds to provide an infinite canvas for high-contrast data overlays and a central 3D globe. The aesthetic combines elements of **Minimalism** for data clarity and **Glassmorphism** for interface overlays, creating a sense of depth and focus. The emotional response is one of serious observation transitioned into hopeful stewardship.

## Colors
The palette is centered on a "Deep Space" foundation, ensuring that vibrant data points possess maximum luminosity.

- **Primary (Background):** #05070A serves as the void, minimizing screen glare and maximizing the perceived brightness of data layers.
- **UI Accents (Teal/Cyan):** Used for interactive states, hover effects, and active navigation. These represent the "human" layer of the interface.
- **Semantic/Alert Colors:**
    - **Vibrant Red:** Immediate environmental threats (wildfires, deforestation).
    - **Ice Blue:** Cryosphere data and cooling trends.
    - **Forest Green:** Reforestation, biodiversity health, and positive outcomes.
    - **Warning Orange:** Irregular data spikes or atmospheric anomalies.

## Typography
This design system utilizes **Inter** for all primary interface elements due to its exceptional legibility at small sizes and high-density data environments. To lean into the scientific nature of the platform, **JetBrains Mono** is introduced for labels, coordinates, and telemetry data to provide a technical, precise feel.

Headlines should use tight letter spacing to appear urgent and impactful. Body text maintains a generous line height (1.6) to prevent cognitive fatigue during long sessions of data analysis. All numerical data should utilize tabular lining (monospace) to ensure columns of figures remain aligned.

## Layout & Spacing
The layout follows a **Fluid Grid** model designed to frame a central viewport for the 3D globe. 

- **Desktop:** A three-tier architecture with a persistent top bar for global navigation, a floating translucent left sidebar for data layers, and a right-side panel for specific entity details.
- **Mobile:** Transition to a bottom-sheet model for data layers to keep the central visualization visible.
- **Spacing:** An 8px base unit is used throughout. Layout margins are wide (32px) on desktop to create a premium, uncrowded feel, while gutters are kept tight (16px) to maximize data density within component groups.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Glassmorphism** rather than traditional shadows, which would muddy the dark background.

- **Level 0 (Base):** #05070A. The deep background.
- **Level 1 (Panels):** Translucent overlays using an 80% opacity fill of the primary color with a 20px backdrop blur.
- **Level 2 (Active Cards/Modals):** A subtle 1px border using a low-opacity Cyan (#00F2FF, 20%) to define the shape against the dark background.
- **Interactions:** Hover states should utilize "Inner Glow" effects or subtle Cyan outlines to suggest a "backlit" instrument panel.

## Shapes
The design system adopts a **Soft** shape language. Elements utilize a 0.25rem (4px) corner radius. This choice avoids the clinical harshness of sharp corners while maintaining a professional, scientific posture. Circular shapes are reserved exclusively for status indicators, avatars, and data nodes on the globe to distinguish them from structural UI elements.

## Components
- **Translucent Cards:** Backgrounds must use `backdrop-filter: blur(20px)` with a very thin #FFFFFF (10% opacity) border. 
- **Data Chips:** Small, monospaced labels with background tints corresponding to the semantic status (e.g., a Red tint for "CRITICAL").
- **Minimalist Icons:** 2px stroke width, geometric, non-filled icons to maintain a lightweight "heads-up display" (HUD) feel.
- **Input Fields:** Bottom-border only or very subtle outlined boxes; focus state shifts the border to Cyan with a faint outer glow.
- **Buttons:**
    - *Primary:* Solid Cyan with black text for high visibility.
    - *Secondary:* Ghost style with Cyan border and text.
    - *Urgent:* Solid Red with white text for critical actions.
- **Data Labels:** Always utilize JetBrains Mono for coordinates, timestamps, and metric values to emphasize scientific accuracy.
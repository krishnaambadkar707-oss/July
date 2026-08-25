---
name: Vitalis Dark
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#6bd8cb'
  on-secondary: '#003732'
  secondary-container: '#29a195'
  on-secondary-container: '#00302b'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#e29100'
  on-tertiary-container: '#523200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 16px
---

## Brand & Style

The design system is engineered for a premium pharmacy experience that balances clinical authority with modern digital sophistication. The brand personality is calm, precise, and reassuring. 

The aesthetic leverages **Modern Corporate** principles with a **Glassmorphic** touch to navigate the complexity of medical data. It prioritizes high legibility and "breathable" layouts to reduce the cognitive load often associated with healthcare applications. The UI evokes an emotional response of security and vitality, utilizing deep backgrounds to make critical health information and "action" states stand out through high-contrast luminance.

## Colors

The palette is rooted in a "Deep Sea" dark mode. The primary engine of the UI is **Emerald Green** (#10B981), chosen for its association with health and pharmacy. This is paired with **Medical Teal** for secondary interactions to maintain a cool, professional temperature.

- **Primary & Secondary:** Used for CTA buttons, active states, and brand-heavy components.
- **Surface Strategy:** Backgrounds utilize a layered approach. The base is a deep navy (#0F172A), while cards and containers use a lighter slate (#1E293B) to create perceived depth without the need for heavy shadows.
- **Semantic Accents:** Soft mint is reserved for "Order Confirmed" or "In Stock" states, while Amber is strictly for medical alerts or low-stock warnings.

## Typography

This design system employs a dual-font strategy. **Plus Jakarta Sans** is used for headlines to provide a friendly, modern, and slightly rounded geometric character that softens the clinical nature of the app. **Inter** is used for all body copy and data-heavy tables to ensure maximum legibility and a neutral, systematic feel.

All medical dosages and drug names should use `body-md` at minimum to ensure accessibility. Headlines use a tighter letter-spacing for a more "locked-in" professional appearance.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a maximum container width to prevent line lengths from becoming unreadable on ultra-wide monitors. 

- **The 8pt Grid:** All padding and margins are increments of 8px (or 4px for tight UI elements).
- **Desktop:** 12-column grid with 24px gutters. Use generous margins (64px) to create a premium, "spacious" feel that reduces user anxiety.
- **Mobile:** 4-column grid with 16px margins.
- **Reflow:** Cards should stack vertically on mobile, but keep a consistent 16px corner radius across all breakpoints to maintain the "soft-tech" identity.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

1.  **Level 0 (Base):** #0F172A. Used for the main app background.
2.  **Level 1 (Surface):** #1E293B. Used for cards, prescription lists, and secondary navigation sidebars.
3.  **Level 2 (Overlay):** #334155. Used for hover states on cards or active input fields.
4.  **Borders:** Use 1px solid borders at 10% white opacity (#FFFFFF1A) for surface definition.
5.  **Shadows:** When necessary (e.g., Modals), use a very large, soft blur (32px) with a deep navy tint rather than pure black to maintain the color harmony.

## Shapes

The design system utilizes **Rounded** corners to evoke a sense of safety and approachability. 

- **Standard Buttons/Inputs:** 0.5rem (8px).
- **Cards & Containers:** 1rem (16px) for large structural elements to give a soft, modern container feel.
- **Chips/Badges:** Pill-shaped (fully rounded) to differentiate them from interactive buttons.

## Components

- **Buttons:** Primary buttons use a subtle vertical gradient from Emerald to Teal. Secondary buttons are "Ghost" style with a 1px border. 
- **Inputs:** Dark backgrounds (#0F172A) with a soft slate border. On focus, the border transitions to Primary Emerald with a 2px outer "glow" (0.2 opacity).
- **Cards:** No shadow; use a subtle border (#FFFFFF1A) and a slightly lighter background (#1E293B) than the page base.
- **Prescription Chips:** Use a background-tinted version of the semantic colors (e.g., low-opacity Mint for "Ready for Pickup").
- **Lists:** High-contrast rows with clear dividers. Medical names should be `headline-md` equivalent for quick scanning.
- **Specialty Components:** Include a "Dosage Progress" bar (using a teal gradient) and "Doctor's Note" callouts using the deep navy background with a primary left-accent border.
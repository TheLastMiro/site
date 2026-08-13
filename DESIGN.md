---
name: Modern Wholesale
colors:
  surface: '#FFFFFF'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  border-light: '#E2E8F0'
  border-subtle: '#F1F5F9'
  accent-bg: '#ECFDF5'
  text-muted: '#94A3B8'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.35rem
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  price-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  card-title:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.05rem
    fontWeight: '700'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.8125rem
    fontWeight: '600'
    lineHeight: '1.2'
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: '1.2'
  badge-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.6875rem
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.06em
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 18px
  lg: 20px
  xl: 24px
  gutter: 18px
  margin-mobile: 20px
---

## Brand & Style

This design system is built for a "Premium Wholesale" experience, blending the efficiency of a B2B platform with the polished aesthetic of modern consumer-facing technology. The brand personality is professional, dependable, and meticulously clean, designed to instill trust in bulk buyers while maintaining a fresh, contemporary feel.

The visual direction follows **Minimalism with Glassmorphic influences**. It utilizes heavy whitespace and a restricted, high-contrast palette to ensure product and pricing information remains the primary focus. Sophisticated layering—achieved through backdrop blurs and subtle tonal depth—creates a clear information hierarchy, while large corner radii soften the professional tone to make the interface approachable.

## Colors

The color palette is anchored by **Deep Slate (#0F172A)**, used for primary typography and critical information to ensure maximum authority and readability. **Healthy Green (#059669)** serves as a functional accent, strictly reserved for availability statuses, "in-stock" indicators, and success states to reinforce the freshness of the dairy products.

Secondary and muted slates handle the UI's structural elements and secondary labels, preventing the interface from feeling visually heavy. The background is a very light, cool gray, providing enough contrast for white surface cards to "pop" via subtle shadows.

## Typography

This design system exclusively uses **Plus Jakarta Sans** to maintain a modern, geometric, and highly legible profile. The type scale is characterized by aggressive weight contrasts—using Extra Bold (800) for headers and prices to drive the user's eye toward commercial data, while using Medium (500) for body text to maintain a premium feel.

Mobile responsiveness is handled by maintaining base sizes but allowing for tighter line heights. Price displays should always use the `price-display` token to ensure they are the most prominent element on any product surface.

## Layout & Spacing

The layout follows a **fluid grid model** with a strong emphasis on a mobile-first experience. A standard 20px global margin is applied to the container to provide breathing room on smaller screens. 

Spacing follows a 4px/8px rhythmic scale, but specifically utilizes "optical" increments like 18px and 20px for component internals to create a spacious, airy feel. Catalog items are arranged in a multi-column grid that reflows from 1 column (mobile) to 2 columns (tablet) and up to 4 columns (desktop), maintaining a consistent 18px gutter between cards.

## Elevation & Depth

Depth is achieved through a combination of **soft ambient shadows** and **backdrop blurs**. 

- **Level 1 (Sticky Elements):** Headers and navigation bars use a high `z-index` and a `backdrop-filter: blur(12px)` with 92% opacity. This keeps the user grounded in the catalog while maintaining a sense of space.
- **Level 2 (Cards):** Product cards utilize a soft, diffused shadow (`rgba(15, 23, 42, 0.05)`) to lift them slightly off the light gray background.
- **Level 3 (Interactions):** Active states, such as selected category tabs, use a more pronounced shadow to indicate focus and physical "pressability."

Avoid using harsh borders for depth; rely on tonal shifts between the `#F8F9FA` background and `#FFFFFF` surfaces.

## Shapes

The shape language is a defining characteristic of this design system, using a "container vs. action" logic:

1.  **Containers:** All primary cards and content wrappers use a **20px radius**. This large, soft rounding creates the premium, modern aesthetic.
2.  **Interactive Elements:** Tabs, primary buttons, and status badges use a **pill-shape (100px radius)**. This distinguishes clickable elements from static containers.
3.  **Small Accents:** Internal elements like product tags use a smaller **6px radius** to maintain internal structural integrity without competing with the main card's curve.

## Components

### Buttons & Pills
Primary actions (like the phone/contact button) must be pill-shaped. They should utilize the `primary_color_hex` for background with white text. Use a slight scale-down effect (`0.97`) on active states to provide tactile feedback.

### Product Cards
Cards are the primary unit of the design. They must feature a white surface, 20px corner radius, and the `shadow-card` elevation. The product image should be housed in a placeholder wrapper with a subtle 135-degree linear gradient.

### Navigation Tabs
Category tabs should be arranged in a horizontally scrollable list with a `blur` background. Inactive tabs are white with a subtle border; active tabs should transition to the primary text color with a more significant shadow.

### Input Fields & Search
Maintain the 20px radius for large search bars to match the card aesthetic. Use `border-light` for the default state and a 1px `primary_color_hex` border for the focused state.

### Availability Badges
Always use the `badge-caps` typography. The background should be `accent-bg` with `accent-green` text to ensure high contrast and immediate recognition of product status.
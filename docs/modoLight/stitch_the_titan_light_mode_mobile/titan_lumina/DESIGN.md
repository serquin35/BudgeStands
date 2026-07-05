---
name: Titan Lumina
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#464554'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#767586'
  outline-variant: '#c7c4d7'
  surface-tint: '#494bd6'
  primary: '#4648d4'
  on-primary: '#ffffff'
  primary-container: '#6063ee'
  on-primary-container: '#fffbff'
  inverse-primary: '#c0c1ff'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#6b38d4'
  on-tertiary: '#ffffff'
  tertiary-container: '#8455ef'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
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
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  container-max: 1440px
  sidebar-width: 260px
---

## Brand & Style

This design system translates a heavy, dark-mode industrial SaaS application into a high-clarity, light-mode environment. The brand personality is **Professional, Systematic, and Precise**, retaining the "Titan" sense of strength through structured layouts while increasing accessibility and cognitive ease.

The visual style is **Corporate / Modern** with a focus on **Tonal Layering**. It moves away from the deep blacks of the original interface toward a hierarchy of clean whites and cool grays. This approach ensures that the primary purple accents—representative of AI capabilities and primary actions—pop with maximum intent. The UI should evoke a sense of organized efficiency, reliability, and modern intelligence.

- **Primary Motif:** Clean surfaces with subtle depth.
- **Tone:** Technical yet approachable.
- **Target Audience:** Enterprise managers, project coordinators, and financial analysts.

## Colors

The palette is anchored by a high-contrast foundation to ensure readability in a data-heavy SaaS environment.

- **Primary (#6366F1):** A vibrant Indigo/Purple used for primary buttons, active states, and AI-driven features.
- **Secondary (#1E293B):** A deep Slate used for text and iconography to maintain the professional "Titan" weight without the harshness of pure black.
- **Backgrounds:** The interface uses `background_main` (#FFFFFF) for the workspace and `background_subtle` (#F1F5F9) for sidebars, headers, and container backgrounds to create clear structural separation.
- **Accents:** Semantic colors (Success: #10B981, Warning: #F59E0B, Error: #EF4444) should be used sparingly against the neutral backdrop to signal status changes effectively.

## Typography

The typography system balances the technical nature of SaaS with the modern aesthetic of the startup world.

- **Hanken Grotesk** is used for headlines to provide a sharp, contemporary edge that feels "engineered."
- **Inter** handles the bulk of data and body text, chosen for its exceptional legibility at small sizes and high x-height.
- **JetBrains Mono** is utilized for metadata, tags, and specific data points (like Reference IDs) to lean into the technical "Titan" heritage of the application.

**Scale:**
- Use `display-lg` for main page headers.
- Use `label-caps` for table headers and section overlines.
- Ensure 16px base size for inputs to prevent iOS zoom-on-focus.

## Layout & Spacing

This design system employs a **Fixed-Fluid Hybrid Grid**. The sidebar remains fixed, while the content area utilizes a fluid 12-column grid with a maximum cap of 1440px to ensure data density doesn't become overwhelming on ultra-wide monitors.

- **Gutters:** 24px (md) consistently between cards.
- **Margins:** 32px (lg) page padding for desktop, 16px (sm) for mobile.
- **Density:** Use "Standard" density for most views, but switch to "Compact" (8px/12px padding) for data tables and Kanban cards to maximize visible information.
- **Breakpoints:**
  - Mobile: < 768px (Single column, hidden sidebar)
  - Tablet: 768px - 1024px (Collapsable sidebar)
  - Desktop: > 1024px (Full layout)

## Elevation & Depth

In light mode, hierarchy is achieved through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Surface):** The main background (`background_subtle`).
- **Level 1 (Card):** White surfaces (#FFFFFF) with a 1px border (#E2E8F0). This is the primary container for all content.
- **Level 2 (Hover/Active):** A very soft, diffused shadow (0px 4px 12px rgba(0, 0, 0, 0.05)) to indicate interactivity when hovering over cards or buttons.
- **Level 3 (Modals):** A more pronounced shadow (0px 12px 32px rgba(0, 0, 0, 0.1)) to separate overlays from the primary workspace.

Avoid "pure black" shadows; instead, use tinted slates to keep the interface looking clean and integrated.

## Shapes

The shape language is **Rounded**, conveying a modern and user-friendly SaaS feel.

- **Standard Elements:** 0.5rem (8px) for inputs, small buttons, and tags.
- **Cards & Containers:** 1rem (16px) for main content containers and dashboard widgets.
- **Buttons:** 0.5rem for primary actions; pill-shape (3rem) can be used for specific "AI" or "Quick Action" buttons to make them visually distinct from standard forms.

## Components

### Buttons
- **Primary:** Solid #6366F1 background with White text.
- **Secondary:** Transparent with a #E2E8F0 border and #1E293B text.
- **AI/Special:** Gradient or specific icon treatment using #8B5CF6 (Tertiary).

### Cards
- Cards must have a 1px solid border (#E2E8F0). 
- Card headers should use `title-sm` with a bottom divider if they contain multiple sections.
- For "Kanban" style boards, cards should use a slightly lighter background than the column to maintain visibility.

### Input Fields
- Background: #FFFFFF.
- Border: 1px solid #E2E8F0.
- Focus State: 1px solid #6366F1 with a 2px soft indigo outer glow.
- Labels: `body-sm` in `text_secondary` weight.

### Data Tables
- Row height: 56px for standard, 48px for compact.
- Header background: #F8FAFC.
- Row separators: 1px solid #F1F5F9.

### Chips & Tags
- Default: #F1F5F9 background with `text_secondary`.
- Status-based: Use light pastel backgrounds with dark text (e.g., Success: Light Green background with Dark Green text).
# ATS Pro Design System

## 2026 editorial operations refresh

This section supersedes older Sahara visual values below where they conflict.

- Direction: premium editorial operations UI, charcoal product shell, neutral work
  surfaces, and a controlled warm-orange signal color.
- Dials: variance 7/10, motion 4/10, density 7/10.
- Light tokens: background `#F3F4F6`, surface `#FFFFFF`, text `#17181A`,
  muted `#62666D`, border `#DFE2E7`, primary `#C74616`, secondary `#168565`.
- Dark tokens: background `#101216`, surface `#181B21`, text `#F5F6F8`,
  muted `#AAB0BA`, border `#353B45`, primary `#F0773F`, secondary `#57C6A2`.
- Sidebar: 264px charcoal surface with a light active state and amber product mark.
- Page titles use Georgia/serif for editorial contrast; body and control copy keep
  the Segoe/system sans stack.
- Shared cards use 16px radius. Kanban, metrics, directory, and job views use
  purpose-built variants instead of nesting generic cards.

> Source of truth for the ATS Pro web UI. Page overrides in `pages/` may add
> layout rules but must not redefine the global color, type, focus, or motion
> contracts below.

## Product direction

- Product: internal B2B applicant-tracking workspace for HR teams.
- Tone: warm, trustworthy, focused, and operational rather than decorative.
- Style: refined “Sahara” surfaces with restrained depth and dense, scannable data.
- Dials: variance 3/10, motion 2/10, density 8/10.
- Languages: user-facing product copy is Vietnamese; avoid mixed English/Vietnamese headings.

## Semantic color contract

Components use semantic variables, never ad-hoc hex colors. Status colors always
pair color with a text label or icon.

| Role | Light | Dark |
|---|---|---|
| Background | `#F7F2EC` | `#171412` |
| Surface | `#FFFDF9` | `#241E1B` |
| Surface subtle | `#F1EAE2` | `#2E2622` |
| Surface strong | `#E7D9CB` | `#3A302A` |
| Text | `#2D251F` | `#F8EDE0` |
| Text muted | `#675B50` | `#C9B8A6` |
| Border | `#D5C8BC` | `#5C493D` |
| Primary | `#9F4A1B` | `#C86A32` |
| Primary hover | `#7D3813` | `#E07C3D` |
| Secondary | `#566546` | `#9CAF7A` |
| Danger | `#9C352F` | `#E28A80` |
| Focus ring | `#B85824` | `#E4975E` |
| Sidebar | `#4B3328` | `#211917` |
| Sidebar active | `#7C4A2D` | `#7C4A2D` |

## Typography

- Font stack: `"Segoe UI Variable", "Segoe UI", ui-sans-serif, system-ui, sans-serif`.
- Page title: 28–32px, weight 750–800, compact line height.
- Section title: 18–22px, weight 700.
- Body: 14–16px, line-height 1.5–1.65.
- Metadata: at least 12px; never use low-contrast text to create hierarchy.
- Data columns use tabular numerals where values align vertically.

## Layout and spacing

- Use a 4/8px rhythm. Core gaps: 4, 8, 12, 16, 24, 32px.
- Desktop content max width: 1600px; keep wide data pages fluid inside it.
- Desktop sidebar: 248px. Mobile: top bar + dismissible drawer; content must never
  remain squeezed beside a fixed sidebar.
- Page padding: 16px mobile, 24px tablet, 28–32px desktop.
- Cards: 10px radius, 1px border, subtle shadow; no decorative hover lift on static cards.
- Tables: sticky/scannable headers; horizontal scroll or card fallback below 768px.

## Components

### Buttons and controls

- Minimum interactive target: 44×44px for primary controls and icon buttons.
- Primary action uses the primary color; one primary CTA per region.
- Icon-only buttons require `aria-label` and visible focus treatment.
- Disabled/loading state must be semantic and prevent duplicate submission.
- Hover/pressed styles must not move surrounding layout.

### Forms

- Every input has a visible label; placeholder is supplementary only.
- Field error appears beside the field and is announced with `role="alert"`.
- Inputs are at least 44px high on mobile and preserve browser autofill semantics.
- Destructive actions are separated from primary actions and require confirmation.

### Data and status

- Loading over 300ms uses a stable skeleton or labelled progress indicator.
- Empty and error states explain the next action; never render a blank panel.
- Charts include a text summary/table equivalent and do not rely on color alone.
- Candidate states keep consistent label/color mappings across table, Kanban, and charts.

## Accessibility

- Contrast target: WCAG AA (4.5:1 text, 3:1 large text and meaningful graphics).
- Provide a skip link and `main` landmark; route changes focus the page heading.
- Preserve visible `:focus-visible` rings; all workflows must be keyboard reachable.
- Drag-and-drop Kanban must retain a non-drag alternative for status changes.
- Dialogs/drawers have labelled titles, Escape close, focus management, and a 40–60% scrim.

## Motion

- Micro-interactions: 150–220ms, opacity/color/transform only.
- Motion communicates state; no ambient bobbing, pulsing, or decorative parallax.
- Respect `prefers-reduced-motion`; disable smooth scrolling and nonessential transitions.

## Engineering rules

- Prefer reusable primitives and feature components over page-sized JSX files.
- Keep server/data orchestration in hooks or containers; presentational components receive props.
- Use Lucide consistently; no emoji as structural icons.
- Keep light and dark mappings in semantic tokens rather than selector hacks against raw classes.
- Verify at 375, 768, 1024, and 1440px before delivery.

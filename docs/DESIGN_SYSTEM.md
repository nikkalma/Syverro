# Syverro — Design System

## Typography

**Primary typeface:** Inter (sans-serif), multiple weights.
**Display typeface:** Playfair Display (serif), for headings and title treatments.
**Fallback:** System sans-serif.

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| Display | 48px | Regular | App title, hero |
| H1 | 28px | Light (300) | Screen titles |
| H2 | 20px | Regular | Section headers |
| H3 | 16px | Regular | Card titles |
| Body | 14px | Regular | Content text |
| Secondary | 12px | Regular | Labels, metadata |
| Caption | 10px | Regular | Counts, hints |
| Mono | 12px | Monospace | Timer display |

**Line height:** 1.4× font size as baseline.
**Letter spacing:** Negative for large text (−0.5px for display), neutral for body.

**CJK support:** Separate font families for Japanese (NotoSansJP) and Korean (NotoSansKR) with adjusted line height and letter spacing.

---

## Spacing

A unified 4-point baseline grid:

| Token | Pixels |
|-------|--------|
| xs | 4 |
| sm | 8 |
| md | 12 |
| lg | 16 |
| xl | 20 |
| xxl | 24 |
| xxxl | 32 |
| huge | 40 |

All margins, padding, gaps, and element sizing conform to this scale. No arbitrary values.

---

## Cards

Cards have:
- **Border radius:** 16–24px (xl)
- **Background:** Semi-transparent surface color (glass effect)
- **Border:** 1px, low opacity (8–12%)
- **Shadow:** Subtle, using primary color at low opacity
- **Padding:** lg (16px) inside, or none for image-only cards

Card types:
- *Glass card:* Frosted background with border, used for info panels and stat cards
- *Book card:* Square-ish aspect ratio (3:4), cover image or letter placeholder, no internal padding
- *Stat card:* Compact, single metric with label

---

## Buttons

| Type | Height | Radius | Background |
|------|--------|--------|------------|
| Primary | 48–56px | 12–30px | theme.primary |
| Secondary | 44px | 30px (full) | theme.surface + border |
| Icon | 44×44px | 22px (full) | Transparent |
| Ghost | Auto | Auto | Transparent |

**States:** Default, pressed (opacity 0.7), disabled (opacity 0.4).

**Primary button text:** White, weight 500, size 15–16px.
**Secondary button text:** theme.textPrimary or theme.textSecondary.

---

## Lists

- **Book grid:** 3 columns, dynamic card width = (screenWidth − 48 − 32) / 3
- **Session history:** Single column, bordered rows
- **Quote cards:** Single column, surface background, italic text
- **Filter chips:** Horizontal scroll, pill-shaped (radius: full), active = primary color fill

---

## Navigation

### Tab Bar (Bottom)
- Height: 60px
- Background: theme.surface
- Top border: 1px, low opacity
- Active icon: primary color fill
- Inactive icon: textSecondary
- Labels: 11px, below icon

### Stack Header
- Background: theme.surface
- Back button: theme.textPrimary
- Title: weight 300, size 18px
- No back title text (empty string)

### Drawer (optional)
- Not fully implemented in prototype. Planned for future: translucent overlay, blurred background, user avatar at top, navigation items as text rows.

---

## Color Philosophy

The color system is designed for extended reading sessions. High contrast is avoided. Colors are muted, desaturated, and warm.

**Light theme:**
- Background: warm beige (#E0D4C3)
- Surface: lighter beige (#D4C7B4)
- Primary: muted slate (#4A5A6A)
- Text: warm dark (#2A2622)
- Success: muted green (#6B8F7A)
- Warning: muted amber (#D4A76A)
- Error: muted rose (#C47A7A)

**Dark theme:**
- Background: deep navy (#0B1220)
- Surface: slightly lighter navy (#0E1A26)
- Primary: muted blue (#5C7C9A)
- Text: off-white (#E7EDF5)
- Success: muted green (#6B9B7A)
- Warning: muted amber (#D4A76A)
- Error: muted rose (#C47A7A)

**Key principle:** No pure white, no pure black, no fully saturated colors. Every color passes through a "muted" filter.

---

## Atmosphere (Visual)

The visual atmosphere is created through three layers:
1. **Orbs:** Large, blurry, slow-moving gradient circles in the background. Three sizes (400px, 240px, 120px). Colors match the primary palette at very low opacity (6–12%). Movement is sinusoidal with a 15–18 second period.
2. **Glass surfaces:** Semi-transparent panels with blur (BlurView in Expo). Frosted appearance with subtle borders.
3. **Lighting context:** An ambient tint overlay adjusts color temperature based on theme (warm in light mode, cool in dark mode).

This creates a living-but-quiet background that never distracts from content.

---

## Motion Principles

1. **Duration:** Opacity/fade transitions: 120ms. Page transitions: 300ms (default).
2. **Easing:** Linear for opacity, subtle ease-in-out for translations.
3. **Scope:** Animated only where it serves understanding (card press feedback, screen transitions). No decorative animation.
4. **No parallax:** Motion is minimal. Pages do not slide in from unexpected directions.
5. **No spring physics:** All animations use timing functions. No bouncy or overshoot effects.

---

## What Should Never Change

1. The 4-point spacing grid must be preserved. No arbitrary pixel values.
2. The muted color philosophy must not be replaced with saturated or brand-bright colors.
3. Glass/translucent surface treatment is the signature visual element.
4. No pure white backgrounds.
5. No gamification UI (badges, streaks, progress bars shaped as trophies).
6. Typography hierarchy: Screen titles in Light weight, not Bold.
7. The orb background animation is the only decorative motion. No particle effects, no confetti, no animated illustrations.
8. Cards must never fill the full screen width. Content needs breathing room.
9. Tab bar must always show labels (not icon-only).
10. All destructive actions require a two-step confirmation (tap → confirm dialog).
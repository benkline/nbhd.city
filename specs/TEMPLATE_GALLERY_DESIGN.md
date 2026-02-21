# Template Gallery UI - Design System & Visual Specifications

**Version:** 1.0
**Date:** 2026-02-20
**Purpose:** Design guide for custom template UI integration (Phase 10.1)

---

## Design Philosophy

The template gallery showcases the power of user creativity through beautiful, harmonic design patterns. We use intersecting circles (inspired by Chladni plates and harmonic frequencies) to create visual continuity and convey the idea that templates are building blocks that create something greater when combined.

**Core Principles:**
1. **Harmony**: All animations flow at different frequencies creating beautiful interference patterns
2. **Feedback**: User actions instantly trigger visual circle feedback
3. **Depth**: Layered circles create visual hierarchy without clutter
4. **Motion**: Animations respect prefers-reduced-motion for accessibility

---

## Harmonic Circle System

### Base Concept: Chladni Plate Patterns

Standing wave patterns from vibrating plates (Chladni plates) inspire our circle system:
- Multiple circles oscillate at different frequencies (like sine waves)
- Circle intersections create interference patterns
- Colors follow harmonic spectrum (wavelength-based)
- Patterns feel organic, mathematical, beautiful

### Circle Animation Frequencies

All circles animate at prime-based frequencies for maximum visual interest:

```css
/* Animation cycles (in seconds) */
circle-1: 2s   (frequency: 1 wave per 2s)
circle-2: 3s   (frequency: 1 wave per 3s)
circle-3: 5s   (frequency: 1 wave per 5s)
circle-4: 7s   (frequency: 1 wave per 7s)
circle-5: 11s  (frequency: 1 wave per 11s)
```

The least common multiple of 2,3,5,7,11 is 2310s (~38 minutes), so patterns repeat rarely, creating sense of infinite variety.

### Circle Motion Types

Each circle can use different motion patterns:

1. **Breathe**: Gentle pulsing (scale 0.8 → 1.2)
   ```css
   @keyframes breathe {
     0%, 100% { transform: scale(1); }
     50% { transform: scale(1.1); }
   }
   ```

2. **Oscillate**: Left-right or up-down translation
   ```css
   @keyframes oscillate-x {
     0%, 100% { transform: translateX(-10px); }
     50% { transform: translateX(10px); }
   }
   ```

3. **Rotate**: Orbital rotation around center
   ```css
   @keyframes rotate-orbit {
     0% { transform: rotate(0deg); }
     100% { transform: rotate(360deg); }
   }
   ```

4. **Wave**: Sine wave motion (translateY + opacity)
   ```css
   @keyframes wave {
     0%, 100% { transform: translateY(0); opacity: 0.4; }
     50% { transform: translateY(-20px); opacity: 0.8; }
   }
   ```

---

## Color Palette: Harmonic Spectrum

Colors follow wavelength order (like musical notes on a scale):

```
Violet        (380-450nm)  → #7c3aed
Indigo        (450-495nm)  → #4f46e5
Blue          (495-570nm)  → #2563eb
Cyan          (500-550nm)  → #06b6d4
Green         (570-590nm)  → #10b981
Yellow        (590-610nm)  → #eab308
Orange        (610-750nm)  → #f97316
Red           (625-750nm)  → #ef4444
```

**Usage:**
- Background circles: Low opacity (0.1-0.3) for subtle pattern
- Hover/active states: High opacity (0.6-0.8) for strong feedback
- Accent indicators: Full opacity (1.0) for status badges

---

## Navigation Structure

### Sidebar Layout

```
┌─────────────┐
│ ○ TEMPLATES │  ← Icon + text (desktop), icon only (tablet)
│ ○ SITES     │
│ ○ BUILD LOG │
│ ○ SETTINGS  │
│             │
│ [HARMONY]   │  ← Animated circle pattern (faded)
└─────────────┘
```

**Behaviors:**
- Desktop (> 768px): 200px wide, text visible
- Tablet (512-768px): 60px wide, text hidden (tooltips on hover)
- Mobile (< 512px): Hidden (bottom navigation bar instead)

**Active Tab Indicator:**
- Animated circle that expands from left edge
- Smooth transition (200ms cubic-bezier(0.4, 0, 0.2, 1))
- Color matches current tab's harmonic color

### Top Tab Bar

```
[ Browse ] [ My Custom ] [ Featured ] [ Trending ]
    ↓
  Circle accent slides to active tab (left to right)
```

**Behaviors:**
- Desktop/tablet: Full width above gallery
- Mobile: Horizontal scroll (tabs don't wrap)
- Swipe navigation support
- Smooth tab-switching animation (300ms fade + circle transition)

---

## Template Gallery Layout

### Card Grid

```
Desktop (> 768px):
┌─────────┬─────────┬─────────┐
│ Template│ Template│ Template│
│ Card 1  │ Card 2  │ Card 3  │
└─────────┴─────────┴─────────┘
3 columns, 24px gap

Tablet (512-768px):
┌──────────┬──────────┐
│ Template │ Template │
│ Card 1   │ Card 2   │
└──────────┴──────────┘
2 columns, 20px gap

Mobile (< 512px):
┌────────────┐
│ Template   │
│ Card 1     │
├────────────┤
│ Template   │
│ Card 2     │
└────────────┘
1 column, 16px gap
```

**Card Cascade Animation:**
- Cards render one-by-one (50ms stagger)
- Each card fades in + subtle scale-up (from 0.95 to 1.0)
- Total animation for 6 cards: 300ms
- Uses `animation-delay` with CSS Grid

### Template Card Structure

```
┌─────────────────────┐
│  ┌─────────────────┐│  ← Preview area (with circle pattern background)
│  │ [TEMPLATE IMG]  ││
│  │  or CIRCLES     ││
│  └─────────────────┘│
│                     │
│ Template Name ⭐    │  ← Built-in or Custom badge
│ Brief description   │
│                     │
│ [Tag] [Tag] [Tag]   │
│                     │
│ [Select] [Details]  │  ← Buttons (on hover)
└─────────────────────┘
```

**Hover States:**
- Background circles brighten (breathe animation)
- Card shadow deepens (0 → 8px offset)
- Buttons appear (fade in 200ms)
- Text brightens slightly

**Click States:**
- Button becomes active color
- Ripple effect from click point
- Navigation to config or progress modal

---

## Modal Design: CustomTemplateModal

### Layout

```
┌──────────────────────────────┐
│  ○ ○ ○  Add Custom Template  │  ← Header with circle pattern
│  ┌────────────────────────────┤
│  │ GitHub URL                 │
│  │ [_________________________] │  ← Animated focus ring (circle glow)
│  │                            │
│  │ Template Name              │
│  │ [_________________________] │  (auto-extracted)
│  │                            │
│  │ ☐ Make template public     │
│  │                            │
│  │       [Add Template]        │  ← Primary button (animated)
│  └────────────────────────────┘
│
│  ⚙️  Analyzing... 45%            │  ← Or success/error state
│  ◐ ◑ ◒  (spinner)                │
└──────────────────────────────────┘
```

**Animations:**
- Open: Fade in backdrop, slide modal up (300ms)
- Focus: Circle glow around input (breathe animation)
- Analyzing: Spinner circles rotate (3 circles, staggered)
- Success: Checkmark + circle highlight (fade in)
- Close: Slide down, fade out (200ms)

### Input Focus States

```
Normal:     □ [_________________]
Focus:      ⊙ [_________________]   ← Circle glow effect
             \  circle outline      /
              \ (4px, animated     /
               \ pulse every 1s)  /
Error:      ✗ [_________________]   ← Red circle accent
```

---

## Status Indicators

### Template Analysis Progress

Three states with circle-based visuals:

1. **Analyzing** (in-progress)
   ```
   ◕ ◐ ◑  Analyzing template...
   (3 circles, rotating staggered)

   Progress: ████░░░░░░ 40%
   ```

2. **Ready** (success)
   ```
   ✓ ◯  Template ready!
   (checkmark + filled circle)

   Inferred schema: 5 fields, 3 content types
   ```

3. **Failed** (error)
   ```
   ✗ ◯  Analysis failed
   (error icon + red circle)

   Error: Repository not found
   [Re-analyze]
   ```

### Card Status Badge

Appears on custom template cards:

```
┌─────────────────┐
│  Template Name  │
│                 │
│ Custom  ◕ ◐ ◑   │  ← "Analyzing" state (animated)
│         40%     │
└─────────────────┘

┌─────────────────┐
│  Template Name  │
│                 │
│ Custom  ✓       │  ← "Ready" state (green circle)
└─────────────────┘

┌─────────────────┐
│  Template Name  │
│                 │
│ Custom  ✗       │  ← "Failed" state (red circle)
│ (hover → error) │
└─────────────────┘
```

---

## Animation Timings

All animations use standard easing curves:

```javascript
// Standard easing
'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',

// Animation durations
'quick': '150ms',      // Small feedback (focus, hover)
'normal': '200ms',     // Standard (modal open, button click)
'slow': '300ms',       // Tab switch, modal transitions
'glacial': '500ms',    // Cascade animations
```

**Performance Targets:**
- Circle animations: 60fps (use CSS transforms only)
- Modal open/close: < 300ms
- Card cascade: < 500ms total
- No layout shifts during animations

---

## Mobile Interactions

### Touch Feedback

- **Tap**: 100ms highlight color change
- **Long-press**: Show context menu (hold 500ms)
- **Swipe left**: Next tab
- **Swipe right**: Previous tab

### Gesture Animations

```css
/* Tap feedback (ripple) */
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* Swipe dismiss */
@keyframes swipe-out {
  0% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(100%); }
}
```

---

## Accessibility Considerations

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  /* Animations still happen, just instant */
}
```

### Color Contrast

- Text on circle background: Minimum 4.5:1 contrast ratio
- Status indicators: Color + icon (not color-only)
- Links: Underlined or icon plus color

### Keyboard Navigation

- Tab through template cards
- Enter/Space to select
- Escape to close modals
- Arrow keys for tab switching

---

## Responsive Breakpoints

```javascript
{
  'mobile': '0px',      // < 512px (phones)
  'tablet': '512px',    // 512px - 768px
  'desktop': '768px',   // > 768px
  'wide': '1440px',     // > 1440px (4K)
}
```

---

## Code Structure for Subagents

Recommended file organization:

```
src/
├── components/
│   ├── design/
│   │   ├── HarmonicCircles.jsx
│   │   ├── HarmonyPattern.jsx
│   │   └── CircleLoader.jsx
│   ├── navigation/
│   │   ├── SideNavigation.jsx
│   │   ├── TopTabBar.jsx
│   │   └── TemplateLayoutWrapper.jsx
│   └── SiteBuilder/
│       ├── TemplateCard.jsx
│       ├── TemplateDetailsModal.jsx
│       ├── AnalysisProgress.jsx
│       ├── TemplateStatusBadge.jsx
│       ├── EmptyTemplateState.jsx
│       └── TemplateGallery.jsx (enhanced)
│
├── hooks/
│   └── useHarmonyAnimation.ts
│
├── lib/
│   ├── HarmonyAnimation.ts
│   ├── CircleAnimationLibrary.ts
│   └── HarmonyColors.ts
│
├── styles/
│   ├── HarmonyAnimations.css
│   ├── SideNavigation.module.css
│   ├── TopTabBar.module.css
│   ├── responsive.css
│   └── TemplateCard.module.css
```

---

## Testing Checklist for Subagents

Before submitting, verify:

- [ ] Animations run at 60fps (check DevTools performance)
- [ ] No layout shifts during animations
- [ ] Keyboard navigation works
- [ ] Touch interactions responsive
- [ ] Mobile layout functional on < 512px screens
- [ ] Colors meet contrast requirements
- [ ] prefers-reduced-motion respected
- [ ] No console errors or warnings
- [ ] Animations disable gracefully on low-end devices

---

## References

- **Component Specs:** See tickets.md (UI-DESIGN-001 through UI-PERF-001)
- **API Integration:** See TEMPLATE_ANALYSIS.md and BUILD-PIPELINE-UI.md
- **Design Inspiration:** Chladni plates, cymatics, harmonic frequencies

---

# Phase 10.1: Custom Template UI Integration - Complete Overview

**Date Created:** 2026-02-20
**Phase Status:** Tickets created, ready for /next-ticket skill execution
**Total Tickets:** 8
**Estimated Effort:** 10-12 weeks
**Parallelization:** Up to 6 subagents using git worktrees

---

## What We've Created

### 📋 Tickets (in tickets.md)

**8 new frontend tickets for Phase 10.1:**

1. **UI-DESIGN-001** - Harmonic Circle Design System & Animations (L)
2. **UI-NAV-001** - Navigation Structure with Sidebar & Tab System (M)
3. **UI-GALLERY-001** - TemplateGallery Integration with CustomTemplateModal (M)
4. **UI-GALLERY-002** - Merge Custom + Built-in Templates with Cascade Animation (M)
5. **UI-GALLERY-003** - Template Status Indicators with Circle Progress (M)
6. **UI-GALLERY-004** - Template Details & Management Modal (M)
7. **UI-RESPONSIVE-001** - Mobile Optimization & Responsive Design (S)
8. **UI-PERF-001** - Animation Performance & Optimization (M)

**Location:** `/Users/benkline/Projects/nbhd.city/tickets/tickets.md` (lines 1560+)

---

### 🎨 Design System Documents

#### 1. TEMPLATE_GALLERY_DESIGN.md
**Comprehensive design specification** covering:
- Harmonic circle concept (inspired by Chladni plates)
- Animation frequencies (2s, 3s, 5s, 7s, 11s prime-based cycles)
- Color palette (harmonic spectrum: violet → red)
- Navigation structure (sidebar + top tabs)
- Template gallery layout (responsive grid)
- Modal design patterns
- Status indicators
- Mobile interactions
- Accessibility (WCAG AA, prefers-reduced-motion)
- Responsive breakpoints

**Use this for:** Design reference, visual specs, color values, animation timings

#### 2. HARMONIC_CIRCLES_IMPLEMENTATION.md
**Code implementation reference** with:
- HarmonicCircles component API & props
- 5 animation types (breathe, oscillate-x/y, rotate-orbit, wave)
- CSS keyframes (copy-paste ready)
- Recommended circle configurations (4 patterns)
- Color palette code
- useHarmonyAnimation hook
- Component templates
- Performance optimization tips
- Testing examples
- Debugging guide

**Use this for:** Implementation code, animation examples, copy-paste templates

---

### 📊 Ticket List Update

**Location:** `/Users/benkline/Projects/nbhd.city/tickets/ticket-list.md`

Added new section:
```
### 🎨 Phase 10.1: Custom Template UI Integration & Design System (Weeks TBD)

- [ ] UI-DESIGN-001 (Harmonic Circle Design System & Animations)
- [ ] UI-NAV-001 (Navigation Structure with Sidebar & Tab System)
- [ ] UI-GALLERY-001 (TemplateGallery Integration with CustomTemplateModal)
- [ ] UI-GALLERY-002 (Merge Custom + Built-in Templates with Cascade Animation)
- [ ] UI-GALLERY-003 (Template Status Indicators with Circle Progress)
- [ ] UI-GALLERY-004 (Template Details & Management Modal)
- [ ] UI-RESPONSIVE-001 (Mobile Optimization & Responsive Design)
- [ ] UI-PERF-001 (Animation Performance & Optimization)

Total: 8 tickets, 10-12 weeks, parallelizable with 6 subagents
```

---

## How to Use These Tickets with /next-ticket

### Single Subagent Flow

```bash
# User runs:
/next-ticket

# Claude Code will:
# 1. Read the new Phase 10.1 tickets from tickets.md
# 2. Create git worktree
# 3. Pick first ticket: UI-DESIGN-001
# 4. Implement with reference to TEMPLATE_GALLERY_DESIGN.md
# 5. Commit and test
# 6. Loop to next ticket
```

### Multi-Subagent Parallel Flow

```bash
# For 6 parallel subagents, run in sequence:

# Agent 1: Design System (foundation)
/next-ticket  # Picks UI-DESIGN-001

# Agent 2: Navigation (can run in parallel)
/next-ticket  # Picks UI-NAV-001 (depends on UI-DESIGN-001 being mostly done)

# Agents 3-6: Gallery components (depends on 1 & 2)
/next-ticket  # UI-GALLERY-001
/next-ticket  # UI-GALLERY-002
/next-ticket  # UI-GALLERY-003
/next-ticket  # UI-GALLERY-004

# Agent 5: Mobile & Performance (final polish)
/next-ticket  # UI-RESPONSIVE-001
/next-ticket  # UI-PERF-001
```

### Dependency Chain

```
UI-DESIGN-001 (Design System Foundation)
    ↓
UI-NAV-001 (Navigation)
    ↓
UI-GALLERY-001 (Modal Integration)
    ↓
UI-GALLERY-002 (Merge Templates)
    ├→ UI-GALLERY-003 (Status Indicators) - can run in parallel
    └→ UI-GALLERY-004 (Details Modal)
    ↓
UI-RESPONSIVE-001 (Mobile)
    ↓
UI-PERF-001 (Performance)
```

---

## Key Files to Reference During Implementation

### For All Subagents

1. **Design Specification:**
   - `/specs/TEMPLATE_GALLERY_DESIGN.md` - Read this first!
   - Understand: harmonic circles, color palette, animation timings, responsive layout

2. **Implementation Guide:**
   - `/specs/HARMONIC_CIRCLES_IMPLEMENTATION.md` - Code examples, copy-paste templates

3. **Existing Components:**
   - `/app/UI/src/components/SiteBuilder/CustomTemplateModal.jsx` - Already implemented!
   - `/app/UI/src/components/SiteBuilder/TemplateGallery.jsx` - Starting point for integration

4. **Ticket Details:**
   - `/tickets/tickets.md` - Detailed requirements and acceptance criteria

### For Specific Agents

**UI-DESIGN-001 Agent:**
- Focus: `HarmonicCircles.jsx`, animation library, color system
- Reference: HARMONIC_CIRCLES_IMPLEMENTATION.md (entire document)

**UI-NAV-001 Agent:**
- Focus: Sidebar + Tab layout, responsive behavior
- Reference: TEMPLATE_GALLERY_DESIGN.md (Navigation Structure section)

**UI-GALLERY-001 Agent:**
- Focus: Integrate CustomTemplateModal into TemplateGallery
- Reference: tickets.md (UI-GALLERY-001), existing CustomTemplateModal.jsx

**UI-GALLERY-002 Agent:**
- Focus: Merge templates with cascade animation
- Reference: TEMPLATE_GALLERY_DESIGN.md (Template Gallery Layout)

**UI-GALLERY-003 Agent:**
- Focus: Status badges with circle animations
- Reference: HARMONIC_CIRCLES_IMPLEMENTATION.md (Patterns section)

**UI-GALLERY-004 Agent:**
- Focus: Details modal with template information
- Reference: TEMPLATE_GALLERY_DESIGN.md (Modal Design section)

**UI-RESPONSIVE-001 Agent:**
- Focus: Mobile-first responsive design
- Reference: TEMPLATE_GALLERY_DESIGN.md (Mobile Interactions section)

**UI-PERF-001 Agent:**
- Focus: Performance optimization and testing
- Reference: HARMONIC_CIRCLES_IMPLEMENTATION.md (Performance Tips & Testing)

---

## Visual Design Highlights

### Harmonic Circle Concept

Circles animate at prime-based frequencies creating interference patterns:
- Circle 1: 2s cycle (breathe animation)
- Circle 2: 3s cycle (oscillate)
- Circle 3: 5s cycle (wave)
- Circle 4: 7s cycle (rotate)
- Circle 5: 11s cycle (breathe)

LCM(2,3,5,7,11) = 2310s (~38 min) → Patterns feel infinite and unique

### Color Harmony Palette

Colors follow harmonic wavelengths:
```
Violet (380nm)   → #7c3aed
Indigo (450nm)   → #4f46e5
Blue (495nm)     → #2563eb
Cyan (500nm)     → #06b6d4
Green (570nm)    → #10b981
Yellow (590nm)   → #eab308
Orange (610nm)   → #f97316
Red (625nm)      → #ef4444
```

### Navigation Layout

**Desktop:** Sidebar (200px) + Main content + Top tabs
**Tablet:** Collapsed sidebar (60px icons) + Main content + Top tabs
**Mobile:** Bottom navigation bar + Main content (full width)

---

## Testing Checklist for /next-ticket Agents

Before marking each ticket as complete:

- [ ] Component renders without errors
- [ ] All props work as documented
- [ ] Animations run at 60fps (use Chrome DevTools)
- [ ] No layout shifts during animations
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Mobile layout responsive (< 512px)
- [ ] Touch interactions work on mobile
- [ ] Color contrast meets WCAG AA
- [ ] prefers-reduced-motion respected
- [ ] No console errors or warnings
- [ ] Unit tests passing
- [ ] Storybook stories created (if applicable)

---

## Implementation Path

### Week 1: Foundation
- UI-DESIGN-001: Design system, circle animations, colors
- UI-NAV-001: Sidebar, tab bar, layout wrapper

### Week 2: Integration
- UI-GALLERY-001: Wire modal into gallery
- UI-GALLERY-002: Merge templates, cascade animation

### Week 3: Features
- UI-GALLERY-003: Status indicators
- UI-GALLERY-004: Details modal

### Week 4: Polish
- UI-RESPONSIVE-001: Mobile optimization
- UI-PERF-001: Performance tuning

---

## Context for Subagents

Each ticket contains:

1. **Description** - What to build
2. **Requirements** - Detailed specifications (checkboxes)
3. **Acceptance Criteria** - How to verify it works
4. **Type** - Frontend/Design/Component/etc.
5. **Estimate** - Time estimate (S/M/L)
6. **Implementation Files** - Which files to create/modify
7. **Dependencies** - What this depends on

The /next-ticket skill will:
1. Pick the next ticket automatically
2. Read all the details
3. Reference TEMPLATE_GALLERY_DESIGN.md and HARMONIC_CIRCLES_IMPLEMENTATION.md
4. Implement the component
5. Create tests
6. Commit with a meaningful message
7. Move to next ticket

---

## Git Worktree Strategy

Each subagent gets its own worktree:

```bash
git worktree add feature/ui-design-001
git worktree add feature/ui-nav-001
git worktree add feature/ui-gallery-001
# ... etc
```

**Benefits:**
- No conflicts when working in parallel
- Independent git history per worktree
- Can merge each feature independently
- Each subagent can test their code in isolation

---

## Expected Outcome

After all 8 tickets complete:

✅ **Functional:** Users can register custom templates and see them in gallery
✅ **Beautiful:** Harmonic circle animations throughout
✅ **Responsive:** Works on mobile, tablet, desktop
✅ **Performant:** 60fps animations, no jank
✅ **Accessible:** Full keyboard navigation, contrast ratios, motion preferences
✅ **Tested:** Unit tests, performance tests, accessibility tests

---

## Questions for Subagents

If a subagent gets stuck:

1. **"Which section of TEMPLATE_GALLERY_DESIGN.md covers this?"**
   → Most questions answered in design spec

2. **"Can I use the pattern from HARMONIC_CIRCLES_IMPLEMENTATION.md?"**
   → Yes! Copy-paste and adapt

3. **"What's the acceptance criteria?"**
   → Check the ticket in tickets.md

4. **"Can I start this ticket?"**
   → Check dependencies in the dependency chain above

5. **"Should I add a Storybook story?"**
   → Yes! Include basic stories for all components

---

## Summary

**We've provided:**
- 8 well-specified frontend tickets
- 2 detailed design/implementation guides
- Copy-paste code examples
- Clear dependencies and execution order
- Testing checklist
- Everything needed for /next-ticket to work autonomously

**Ready to run:**
```bash
/next-ticket  # Will pick UI-DESIGN-001 and implement harmonic circles
```

Each subagent will reference TEMPLATE_GALLERY_DESIGN.md and HARMONIC_CIRCLES_IMPLEMENTATION.md as they work, creating beautiful, functional, performant UI components.

---

# Phase 11: Dashboard Entry List + Optimistic Updates - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-15
**Phase:** 11-Dashboard Entry List + Optimistic Updates
**Areas discussed:** Entry card content, Empty state, Animation & transitions, Scroll behavior

---

## Entry Card Content

| Option | Description | Selected |
|--------|-------------|----------|
| Compact | Emoji, timestamp, content preview (~100 chars), emotion pills. Compact single-line layout. | |
| Expanded | Same as compact but with full content visible (truncated at 300 chars). Taller cards. | |
| Minimal | Just emoji + timestamp + first line of content. Minimal, clean. | |
| Compact + accordion | Compact but onclick will show the full content like accordion | ✓ |

**User's choice:** Compact cards with accordion expand on click
**Notes:** User wants compact by default, full content on tap/click

| Option | Description | Selected |
|--------|-------------|----------|
| Relative | Relative time like '2h ago', '5m ago', 'just now'. More natural for recent entries. | ✓ |
| Absolute | Clock time like '3:42 PM'. Precise but less contextual. | |
| Relative + absolute on hover | Show relative by default, absolute on hover/tap. | |

**User's choice:** Relative timestamps
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Primary + secondary | Show primary emotion as a colored pill + secondary emotions as smaller pills. Matches calendar overlay style. | ✓ |
| Primary only | Just the primary emotion pill. Cleaner, less cluttered. | |
| Emoji + text pill | Show emoji + primary emotion text in one pill. Compact. | |

**User's choice:** Primary + secondary emotion pills
**Notes:** Matches existing calendar overlay style from Phase 10

---

## Empty State

| Option | Description | Selected |
|--------|-------------|----------|
| Simple text | Simple text: 'No entries yet today. Start writing above!' with subtle opacity. Minimal, non-distracting. | |
| Illustration + text | Small illustration or icon with the text. More visual but adds an asset. | ✓ |
| Hidden when empty | Don't show anything when empty. The textarea is the focus. | |

**User's choice:** Illustration + text
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| SVG / emoji | Use a simple SVG or emoji-based illustration (e.g., a pen, a star, a calm scene). No external assets needed. | ✓ |
| Custom image | Use a branded illustration from your design system. Requires an image file. | |

**User's choice:** SVG / emoji illustration
**Notes:** No external image assets needed

---

## Animation & Transitions

| Option | Description | Selected |
|--------|-------------|----------|
| Slide up + fade | New entries slide up from below with a subtle fade. Matches the existing fade-up animation on the textarea. | ✓ |
| Instant (no animation) | Entries just appear instantly. No animation. Fastest, simplest. | |
| Scale up + fade | Entries scale up from 0.95 to 1.0 with fade. More playful feel. | |

**User's choice:** Slide up + fade for new entries
**Notes:** Matches existing textarea fade-up animation

| Option | Description | Selected |
|--------|-------------|----------|
| Fade out + collapse | Entry fades out and collapses smoothly. Other entries shift up to fill the gap. | ✓ |
| Instant removal | Entry just disappears instantly. Other entries jump up. | |
| Slide out left | Entry slides out to the left. More dramatic. | |

**User's choice:** Fade out + collapse for undo
**Notes:** Smooth transition without jarring layout shift

---

## Scroll Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed height + scroll | Entry list takes remaining viewport height and scrolls independently. Textarea stays fixed at top. | |
| Page scroll | Whole page scrolls. Textarea scrolls away as user goes down the list. | |
| Max 3 + show more | Show max 3 entries, then a 'Show more' link. Keeps the page short. | |
| Side-by-side (desktop) + stacked (mobile) | Textarea(left) + entry list(right) on desktop, up-down on mobile | ✓ |

**User's choice:** Side-by-side on desktop, stacked on mobile
**Notes:** User explicitly requested this layout — textarea left, entries right on desktop

| Option | Description | Selected |
|--------|-------------|----------|
| 40/60 split | Textarea takes ~40% width, entry list takes ~60%. Balanced split. | ✓ |
| 50/50 split | Both panels take equal width. 50/50. | |
| 30/70 split | Textarea is narrower (~30%), entries get more space (~70%). | |

**User's choice:** 40/60 split
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| 768px (tablet) | Switch to side-by-side at 768px (standard tablet breakpoint). | ✓ |
| 1024px (laptop) | Switch at 1024px (laptop). Side-by-side only on larger screens. | |
| You decide | You decide based on what looks best. | |

**User's choice:** 768px breakpoint
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Independent scroll | Entry list panel scrolls independently. Textarea stays visible at top/left. Users can write and browse simultaneously. | ✓ |
| Page scroll | Both panels scroll together as one page. Simpler but textarea scrolls away. | |

**User's choice:** Independent scroll on desktop
**Notes:** Textarea stays fixed while entry list scrolls

---

## Claude's Discretion

- Exact content preview length (100 chars suggested, adjust for card proportions)
- Entry card glassmorphism styling (follow existing `.glass` utility pattern)
- Relative timestamp implementation (use `date-fns` formatDistanceToNow or simple custom function)
- Accordion expand/collapse animation timing

## Deferred Ideas

None — discussion stayed within phase scope

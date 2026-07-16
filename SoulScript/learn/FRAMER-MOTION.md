# Framer Motion Animation Patterns

## Overview

SoulScript uses Framer Motion throughout for smooth, physics-based animations. The key patterns are: AnimatePresence for enter/exit transitions, layoutId for shared element morphing, staggered container animations, and drag gestures.

## AnimatePresence

Wraps elements that enter/exit the DOM, providing exit animations:

### Entry List (`src/components/EntryList.tsx`)

```tsx
<AnimatePresence mode="popLayout">
  {entries.map((entry) => (
    <motion.div
      key={entry.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <EntryCard entry={entry} />
    </motion.div>
  ))}
</AnimatePresence>
```

- `mode="popLayout"` — removed items animate out while remaining items reposition smoothly
- `layout` prop — enables layout animation (items slide to fill gaps)
- `exit` — items fade out and shrink upward when deleted

### Undo Toast (`src/app/page.tsx`)

```tsx
<AnimatePresence>
  {toast && (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
    >
      ...
    </motion.div>
  )}
</AnimatePresence>
```

Toast slides up from bottom, slides back down when dismissed.

### Calendar Bottom Sheet (`src/components/MoodCalendar.tsx`)

```tsx
<AnimatePresence>
  {selectedEntries && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        ...
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

Background fades in/out; sheet slides up from bottom with spring physics.

## layoutId Morphing

Calendar day cells use `layoutId` for shared element transitions:

```tsx
<motion.div
  layoutId={`entry-${latestEntry.id}`}
  className="w-full h-full rounded-full glass flex items-center justify-center"
>
  <span className="text-lg">{latestEntry.emoji}</span>
</motion.div>
```

When an entry's emoji changes (e.g., after mood override), the element morphs smoothly between states using the shared `layoutId`.

## Staggered Container Animations

Used in the monthly report (`src/components/MonthlyReport.tsx`):

```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },  // 200ms between each child
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
```

Children animate one after another with a 200ms delay, creating a cascade effect.

## Spring Physics

Bottom sheet and overlays use spring transitions:

```typescript
transition={{ type: "spring", damping: 30, stiffness: 300 }}
```

- **damping** (30) — controls bounce; higher = less bounce
- **stiffness** (300) — controls speed; higher = faster

## Drag Gestures

Bottom sheet drag-to-dismiss:

```tsx
drag="y"                          // vertical only
dragConstraints={{ top: 0 }}      // can only drag down
dragElastic={0.2}                 // rubber band effect at constraint
onDragEnd={(_, info) => {
  if (info.offset.y > 100 || info.velocity.y > 500) {
    setSelectedEntries(null);     // dismiss
  }
}}
```

Two thresholds for natural feel:
- **Distance threshold:** 100px drag = dismiss
- **Velocity threshold:** 500px/s flick = dismiss (even with small drag)

## Textarea Submit Animation

The textarea area fades out and moves up on submit:

```tsx
<motion.div
  animate={justSubmitted
    ? { y: -20, opacity: 0, scale: 0.98 }
    : { y: 0, opacity: 1, scale: 1 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
>
```

Combined with `justSubmitted` state that resets after 600ms.

## Mood Picker Expand/Collapse

```tsx
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: "auto", opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  className="overflow-hidden"
>
```

Height animates from 0 to auto, creating a smooth expand/collapse.

## Delete Modal

Settings page uses scale animation for the confirmation modal:

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
/>
```

## Key Decisions

- **`mode="popLayout"`** for lists — items reposition smoothly when siblings are removed
- **Spring physics** for sheet/modal — feels more natural than easing curves
- **`layout` prop** on list items — enables automatic repositioning
- **Velocity-based dismiss** — natural gesture feel; works on quick flicks
- **No `layoutId` across routes** — only used within the calendar component

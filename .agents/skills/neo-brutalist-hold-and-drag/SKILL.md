---
name: neo-brutalist-hold-and-drag
description: Specification and blueprint for the Neo-Brutalist Hold-and-Drag Side Flyout menu pattern with blurred trigger, overlapping slide-in animation, and hit-testing coordinate handling. Use whenever the user requests a hold-and-drag button, citation button with APA/IEEE options, or a side-docked flyout menu.
---

# Neo-Brutalist Hold-and-Drag Side Flyout Pattern

This pattern defines the exact UX, visual design, and motion choreography for interactive buttons that reveal quick-action options on hold/drag or tap (such as the **KUTIP** APA/IEEE citation generator).

---

## 1. UX Interaction Flow (Dual Mode)

1. **Hold & Drag (Primary Gesture)**:
   - User presses down on trigger button (`pointerdown`).
   - A `150ms` timer starts.
   - If held past `150ms` or moved > `7px`, `isHolding` and `isDragging` become `true`, and `isOpen` becomes `true`.
   - The trigger button enters the "Held" state (blurs and recesses).
   - The side flyout options slide in from the right, docking with an **overlap** over the right edge of the trigger button.
   - While dragging, coordinates (`clientX`, `clientY`) are hit-tested against the flyout options:
     - `clientY < midY` -> Highlights top option (e.g. `APA`).
     - `clientY >= midY` -> Highlights bottom option (e.g. `IEEE`).
   - Upon release (`pointerup`):
     - If released over an option: That option executes immediately, toast feedback appears, and menu closes.
     - If released while still over the trigger button: Menu remains open for manual tapping.
     - If released far outside: Menu dismisses cleanly.

2. **Click / Tap (Fallback Mode)**:
   - A quick tap (< `150ms`) toggles `isOpen` without entering the drag mode.
   - Options remain open on screen, allowing traditional click selection.
   - Clicking anywhere outside (`handleClickOutside`) closes the menu.

---

## 2. Visual Styling (Neo-Brutalism Theme)

- **Trigger Button**:
  - Border: `2px border-black dark:border-white`
  - Shadow: `shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]`
  - Active tap: `active:translate-x-0.5 active:translate-y-0.5`
  - Font: `font-black text-xs uppercase tracking-wide`
  - Normal background: `bg-white dark:bg-black text-black dark:text-white`
  - Open/Active background: `bg-[#FEF08A] text-black`
  - Success background: `bg-[#A3E635] text-black`

- **Side Flyout Container**:
  - Position: `absolute left-full -ml-2.5 top-1/2 z-50` (overlaps the right edge of the trigger by ~10px).
  - Skewed geometry: `-skew-y-6 origin-left` for the energetic brutalist slant.
  - Border: `2.5px border-black dark:border-white`
  - Shadow: `shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]`
  - Overflow: `overflow-hidden`

- **Flyout Options**:
  - Text: Counter-skewed `<span className="skew-y-6 inline-block font-black">` so text remains perfectly upright, legible, and crisp.
  - Colors:
    - Top Option (APA): `bg-[#F472B6]` (vibrant pink) when active.
    - Bottom Option (IEEE): `bg-[#38BDF8]` (vibrant sky blue) when active.
  - Separator: `border-b-2 border-black dark:border-white` between stacked options.

---

## 3. Motion & Animation Signature

1. **Trigger Button when Held**:
   - `blur-[1.5px] opacity-70 scale-[0.98]` with `transition-all duration-150`.
   - Both the box, border, text, and icon blur together into the background layer (`z-10`), creating depth.

2. **Flyout Slide-Left & Overlap**:
   - Keyframe:
     ```css
     @keyframes flyoutSlideLeft {
       from {
         opacity: 0;
         transform: translateY(-50%) skewY(-6deg) translateX(12px);
       }
       to {
         opacity: 1;
         transform: translateY(-50%) skewY(-6deg) translateX(0);
       }
     }
     ```
   - Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for a responsive, springy entry.
   - Sits on higher layer (`z-50`) to cleanly overlap the right border of the blurred button.


# 📜 Scroll-Based Animation Strategy
**Goal:** Enhance the "Game Feel" of the UI menus (Codex, Run Summary, Grimoire) using `framer-motion` to create immersive, tactile interactions without the overhead of GSAP.

---

## 1. Why Framer Motion over GSAP?
*   **Declarative vs. Imperative:** React state drives the UI. Framer Motion hooks into this lifecycle naturally (`<motion.div>`), whereas GSAP requires manual DOM manipulation (`useGSAP`, `refs`), which fights against React's rendering engine.
*   **Bundle Size:** You already have `framer-motion` installed. Adding GSAP would add ~60kb (minified) of unnecessary weight.
*   **Performance:** Framer Motion uses the same hardware-accelerated transforms as GSAP for these types of UI animations.

---

## 2. Concept A: The Living Bestiary (Codex)
*Context: The `HelpScreen.tsx` currently has a simple list of monsters.*

### The Creative Vision
As the player scrolls through the Bestiary, it shouldn't feel like a spreadsheet. It should feel like walking down a dungeon hallway where monsters step out of the shadows.

### Proposed Animations
1.  **Staggered Reveal on Scroll:**
    *   Use `whileInView` on the monster grid container.
    *   As a row enters the viewport, the cards don't just appear; they **flip up** from 90° (flat) to 0° (standing) with a heavy spring physics.
    *   *Effect:* It looks like a pop-up book unfolding.

2.  **Parallax Headers:**
    *   Use `useScroll` hook to track the container's scroll position.
    *   The section headers ("Bestiary", "Items") move slightly slower than the list items.
    *   *Effect:* Creates depth, making the UI feel like it exists on multiple physical planes.

3.  **Dynamic Opacity (Fog of War):**
    *   Items at the very bottom edge of the viewport are blurred and low opacity until they are fully "discovered" (scrolled into the center).
    *   *Implementation:* `useTransform` mapping scroll Y to opacity/blur filter.

### Code Snippet Idea
```tsx
<motion.div
  initial={{ opacity: 0, rotateX: -90, y: 50 }}
  whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ type: "spring", bounce: 0.4 }}
>
  <MonsterCard />
</motion.div>
```

---

## 3. Concept B: The Legacy Scroll (Run Summary)
*Context: The `RunSummary.tsx` right panel shows the progression.*

### The Creative Vision
The "Legacy" panel recounts the hero's life. It should flow like a timeline.

### Proposed Animations
1.  **The "Pinning" Header:**
    *   As you scroll down the rewards list, the "Account Level" header shrinks and sticks to the top, but with a glass-morphism effect that blurs the content passing underneath it.

2.  **Reward Cascade:**
    *   Instead of the unlocks appearing all at once, they trigger sequentially as you scroll.
    *   **Visual:** Unlocks slide in from the right (`x: 100` -> `x: 0`).
    *   **Audio Sync:** Use `onViewportEnter` to trigger a subtle "paper scuff" or "click" sound effect for every item that scrolls into view.

3.  **Sticky Action Bar:**
    *   The "Rise Again" / "Menu" buttons are important.
    *   If the content is too long, these buttons should stay pinned to the bottom of the viewport with a glowing border, urging the player to restart.

---

## 4. Concept C: The Grimoire (Theme Selection)
*Context: Large cards for selecting tilesets.*

### The Creative Vision
Selecting a theme changes the reality of the game. The scroll interaction should emphasize "Focus".

### Proposed Animations
1.  **Center-Focus Magnification:**
    *   Track the center of the scroll container.
    *   The card closest to the center scales up by 1.1x and glows brighter.
    *   Cards on the edges rotate slightly inward (3D rotation), facing the center.

2.  **Background Shift:**
    *   As you scroll past the "Undead" theme, the *actual* background of the Grimoire modal subtly shifts color (e.g., to green/black) to match the focused item.

---

## 5. Technical Implementation Plan

### Phase 1: The Codex (Low Risk)
*   **Action:** Wrap the `MonsterCard` mapping in `HelpScreen.tsx` with `<motion.div>`.
*   **Detail:** Add a staggered delay `index * 0.05` so they ripple in.

### Phase 2: Run Summary Parallax (Medium Risk)
*   **Action:** Refactor `RunSummary` right column to use a `useScroll` ref.
*   **Detail:** Link the Hero Avatar's Y-position to the scroll value so it "parallaxes" away slower than the text.

### Phase 3: Global "In-View" Trigger
*   **Action:** Create a reusable component `<ScrollReveal>` that wraps any content.
*   **Benefit:** We can easily apply this to the Leaderboard rows, Store items, and Settings rows without rewriting animation logic everywhere.

```tsx
// Example Reusable Component
const ScrollReveal = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ delay, duration: 0.5 }}
  >
    {children}
  </motion.div>
);
```

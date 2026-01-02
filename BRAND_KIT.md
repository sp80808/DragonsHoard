# Dragon's Hoard - Brand Kit

## 1. Core Identity
**Dragon's Hoard** is a Dark Fantasy RPG Puzzler. The aesthetic combines the gritty, oppressive atmosphere of a dungeon crawler with the tactile, shiny satisfaction of a slot machine or treasure room.

*   **Keywords:** Arcane, Gritty, Wealth, Ethereal, Tactile.
*   **Visual Metaphor:** "A torch flickering in a treasure vault."

---

## 2. Typography

### Primary Headings (Fantasy)
*   **Font Family:** `Cinzel`, serif.
*   **Usage:** Game Title, Screen Headers, Modal Titles, High-Tier Numbers.
*   **Weights:** 700 (Bold), 900 (Black).
*   **Styling:** Often styled with `tracking-tighter`, `drop-shadow-lg`, and metallic text gradients.

### UI & Body (Legibility)
*   **Font Family:** `Lato`, sans-serif.
*   **Usage:** Card descriptions, button text, stats, inventory numbers.
*   **Weights:** 400 (Regular), 700 (Bold).
*   **Styling:** Often `text-slate-300` or `text-slate-400` for reduced eye strain against dark backgrounds.

---

## 3. Color Palette

### Backgrounds (The Abyss)
| Name | Hex | Usage |
| :--- | :--- | :--- |
| **Void Black** | `#050505` | Global App Background |
| **Panel Base** | `#0b0f19` | Modal/Card Backgrounds |
| **Deep Slate** | `#0f172a` | Biome: Outskirts / Default |

### Primary Accents (The Treasure)
| Name | Tailwind Class | Hex (Approx) | Usage |
| :--- | :--- | :--- | :--- |
| **Gold** | `text-yellow-400` | `#facc15` | Currency, High Scores, Legendary Items |
| **Amber** | `text-amber-500` | `#f59e0b` | Buttons, Highlights, Hoard Biome |
| **Mythic Red** | `text-red-600` | `#dc2626` | Bosses, Health, Danger, "Rise Again" |

### Functional Colors
| Role | Tailwind Class | Hex (Approx) | Usage |
| :--- | :--- | :--- | :--- |
| **XP / Magic** | `text-blue-400` | `#60a5fa` | Experience points, Mana, Scrolls |
| **Buffs / Good** | `text-green-400` | `#4ade80` | Success states, Lootable items |
| **Rare / Arcane**| `text-purple-400`| `#c084fc` | Rune items, Epic rarity |
| **Text Muted** | `text-slate-500` | `#64748b` | Labels, flavor text |

### Gradients
The app relies heavily on gradients rather than flat colors for UI elements.
*   **Gold Gradient:** `bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-600`
*   **Dark Glass:** `bg-slate-900/80 backdrop-blur-md`

---

## 4. UI Components

### Glassmorphism
Panels use a semi-transparent dark slate with a backdrop blur to separate layers while maintaining context.
```css
background-color: rgba(15, 23, 42, 0.8); /* bg-slate-900/80 */
backdrop-filter: blur(12px);
border: 1px solid rgba(51, 65, 85, 0.5); /* border-slate-700/50 */
```

### Borders & Glows
Active elements often feature an "inner glow" via `box-shadow` or `ring`.
*   **Success Glow:** `shadow-[0_0_15px_rgba(74,222,128,0.3)]`
*   **Legendary Glow:** `shadow-[0_0_30px_rgba(234,179,8,0.5)]`

### Buttons
*   **Primary:** Rounded corners (`rounded-xl`), uppercase text, `font-black`. Often uses gradients.
*   **Nav/Tabs:** Icon + Text. Active state usually has a glowing bottom or left border.

---

## 5. Visual Effects (The "Juice")

### Particles
Used for loot drops (`GOLD`, `XP`) and merges.
*   **Motion:** Explosive bursts reducing to a drift.
*   **Shapes:** Circles, Stars, Sparkles (`✨`).

### Animations (Tailwind)
*   `animate-pulse`: Used for guidance/hints.
*   `animate-bounce`: Used for CTAs (Claim Reward).
*   `animate-shimmer`: Used on "skeleton" loading states or shiny cards.
*   `animate-shake`: Used on damage/error.

### 3D Tilt (New)
Cards in the Store and Grimoire react to mouse position, tilting up to 15 degrees to simulate physical weight and reflection.

---

## 6. Iconography
*   **Library:** `lucide-react`
*   **Style:** Stroke width 2px (default).
*   **Consistency:** Icons are almost always paired with text or wrapped in a rounded container.

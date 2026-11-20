# Neo-Aero (Light & Dark Mode) UI Design Guide & Aesthetics Resource Directory

> **[MANDATORY DIRECTIVE FOR AI CODING ASSISTANTS]**
> When using this document as a reference or context file to design or build a user interface:
> 1. **NEVER** insert fake/broken image URLs, random stock photos, or generic low-effort placeholders that compromise the Neo-Aero visual aesthetic.
> 2. **ALWAYS PAUSE AND ASK THE USER** whenever specific images, wallpapers/aurora backgrounds, 3D/2.5D icons, logos, or custom graphic assets are required—allowing the user to provide the exact files or confirm a pure CSS/SVG alternative before proceeding with code generation.
> 3. Strictly adhere to the material specifications (Design Tokens) and GPU performance guidelines outlined below.

---

## Part 1: Neo-Aero & Dark Aero Technical Specifications

**Neo-Aero** merges **modern web architecture, layout grids, and clean typography** (akin to visionOS / Apple Liquid Glass) with the **glossy glass materials, specular surface reflections, and optimistic color palette** of the Frutiger Aero era (2004–2012).

### 1. Material Reference Table: Light Mode vs. Dark Mode

| Component | Light Neo-Aero (Daylight / Sky) | Dark Aero (Smoked Obsidian / Night Aurora) |
| :--- | :--- | :--- |
| **Canvas Background** | Ice Blue-White (`#F0F9FF`) | Deep Oceanic Navy-Black (`#030816`) — *avoid pure `#000`* |
| **Ambient Lighting (Aurora)** | Sky Blue (`#38BDF8`), Cyan (`#22D3EE`), Mint (`#4ADE80`) | Deep Cyan (`#0891B2`), Cobalt (`#1D4ED8`), Emerald (`#059669`) |
| **Glass Surface (Card)** | Milky Translucent White (`rgba(255, 255, 255, 0.72)`) | Smoked Obsidian Blue (`rgba(12, 22, 42, 0.68)`) |
| **Rim Light (Border)** | `1px solid rgba(255, 255, 255, 0.9)` + soft cyan shadow | `1px solid rgba(148, 210, 255, 0.25)` + crisp top inner highlight |
| **Glossy CTA Button** | Vibrant gradient fill + `75%` white top specular sheen | Deep saturated gradient + `35%` white top specular sheen |
| **Typography** | Deep Slate Navy (`#0F172A`) — WCAG compliant | Ice White (`#F8FAFC`) & Cool Slate (`#94A3B8`) |
| **Border Radius** | Large, organic curves (`16px`–`28px` for cards; `9999px` for pills) | Maintain concentric corner radius ratios |

### 2. Core CSS Variables & Glossy Glass Material

```css
:root {
  --aero-bg: #f0f9ff;
  --aero-text: #0f172a;
  --aero-text-muted: #475569;

  /* Light glass & specular rim highlights */
  --aero-glass-bg: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(255, 255, 255, 0.55) 50%,
    rgba(255, 255, 255, 0.75) 100%
  );
  --aero-border: rgba(255, 255, 255, 0.9);
  --aero-specular: rgba(255, 255, 255, 0.95);
  --aero-shadow: 0 12px 32px -4px rgba(2, 132, 199, 0.16);
  --aero-gloss-sheen: rgba(255, 255, 255, 0.72);
}

.dark {
  --aero-bg: #030816;
  --aero-text: #f8fafc;
  --aero-text-muted: #94a3b8;

  /* Smoked Obsidian Glass */
  --aero-glass-bg: linear-gradient(
    180deg,
    rgba(24, 38, 66, 0.75) 0%,
    rgba(10, 18, 34, 0.55) 50%,
    rgba(15, 26, 48, 0.72) 100%
  );
  --aero-border: rgba(125, 211, 252, 0.22);
  --aero-specular: rgba(255, 255, 255, 0.32);
  --aero-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.75);
  --aero-gloss-sheen: rgba(255, 255, 255, 0.28);
}

/* Neo-Aero Glass Card */
.aero-card {
  background: var(--aero-glass-bg);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid var(--aero-border);
  border-radius: 22px;
  box-shadow:
    inset 0 1.5px 1px var(--aero-specular),
    var(--aero-shadow);
  color: var(--aero-text);
}

/* Glossy Pill Button with Top Specular Sheen */
.aero-button {
  position: relative;
  overflow: hidden;
  border-radius: 9999px;
  background: linear-gradient(180deg, #38bdf8 0%, #0284c7 100%);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.8),
    0 6px 16px rgba(2, 132, 199, 0.35);
}

.aero-button::before {
  content: "";
  position: absolute;
  inset: 1px 2px 50% 2px;
  border-radius: 9999px 9999px 40% 40%;
  background: linear-gradient(
    180deg,
    var(--aero-gloss-sheen) 0%,
    rgba(255, 255, 255, 0.12) 100%
  );
  pointer-events: none;
}
```

### 3. Performance & Accessibility Rules

* **Limit Blur Stacking:** Restrict `backdrop-filter: blur()` to a maximum of 2 stacked layers (e.g., Aurora Background → Card → Floating Navbar) with a blur radius between `12px` and `16px` to maintain a smooth 60fps on mobile devices.
* **Lock Opacity for Text Containers:** On cards containing dense body copy, keep background alpha opacity at a minimum of `0.65`–`0.75` to ensure text legibility over vibrant gradients.
* **Iconography:** Avoid thin `1px` minimalist stroke icons. Use glossy 3D/2.5D renders or multi-stop gradient SVGs enhanced with subtle `drop-shadow` filters.

---

## Part 2: Dark / Light Mode Transition Effects

For multi-layered glass interfaces like Neo-Aero, **always use the View Transitions API** (`document.startViewTransition`) rather than individual CSS property transitions to prevent GPU frame drops.

### 1. View Transitions API Implementation (Circular Reveal from Cursor)

```javascript
const toggleTheme = (event) => {
  if (!document.startViewTransition) {
    document.documentElement.classList.toggle("dark");
    return;
  }

  const x = event.clientX;
  const y = event.clientY;
  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y)
  );

  const transition = document.startViewTransition(() => {
    document.documentElement.classList.toggle("dark");
  });

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 450,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  });
};
```

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
```

### 2. Theme Toggle Repositories & Libraries

* **Theme Toggles (SVG Morphing Button Animations):** https://toggles.dev/ | https://github.com/AlfieJones/theme-toggles
* **Next Themes (React/Next.js Theme State Management):** https://github.com/pacocoursey/next-themes
* **Ink-Bleed Theme Changer (Artistic Ink-Spread Transition):** https://github.com/codemure-official/ink-bleed-theme-changer *(Note: If adapting for Neo-Aero, lower SVG turbulence `baseFrequency` to `0.01`–`0.02` and cap duration at `450ms`–`550ms` to achieve a smooth liquid/mercury reveal rather than paper ink bleed).*
* **Darkmode.js (Classic `mix-blend-mode` Reveal):** https://github.com/sandoche/Darkmode.js *(Not recommended for Neo-Aero as blend modes distort translucent glass colors).*

---

## Part 3: Documentation, Tools & Assets for Building Neo-Aero

### 1. Material Specs & Aesthetic History

* **Apple Human Interface Guidelines (Materials & Liquid Glass):** https://developer.apple.com/design/human-interface-guidelines
* **Aesthetics Wiki — Neo-Aero Profile:** https://aesthetics.fandom.com/wiki/Neo-Aero
* **Frutiger Aero Archive (Dark Aero & Helvetica Aqua Sub-aesthetics):** https://frutigeraeroarchive.org/
* **7.css Source Code (Pure CSS 50/50 Split Gloss & Bevel Formulas):** https://github.com/khang-nd/7.css | Live Demo: https://khang-nd.github.io/7.css/
* **Josh W. Comeau (Layered Shadows & Avoiding Dead Gray Zones in Gradients):** https://www.joshwcomeau.com/

### 2. UI Component Libraries & Effect Generators

* **Magic UI (Aurora Background, Border Beam, Animated Theme Toggler):** https://magicui.design/
* **Aceternity UI (Aurora Backgrounds, Interactive Glass Cards):** https://ui.aceternity.com/
* **Raycast Icon Maker (Radial Highlight & Glossy Icon Generator):** https://raycast.com/icon-maker
* **CSS Hero Mesher (Multi-layered Smooth Mesh Gradient Generator):** https://csshero.org/mesher
* **Uiverse (Pure CSS Aqua Buttons & Glossy Card Snippets):** https://uiverse.io/

### 3. Wallpapers, 3D Icons & Live Reference Websites

* **Frutiger Aero & Dark Aero Wallpaper Archive:** https://frutigeraeroarchive.org/wallpapers
* **Spline 3D & Community (Glossy Glass & Refractive 3D Objects):** https://spline.design/ | https://spline.design/community
* **Iconify (Solar Bold Duotone & Fluent Filled Icons for 2.5D Gradient Styling):** https://iconify.design/
* **Live Reference Websites to Inspect:**
  * **Arc Browser:** https://arc.net/
  * **Amie (Joyful UI):** https://amie.so/
  * **Godly (Filter by `3D` + `Gradient` + `Light`):** https://godly.website/

---

## Part 4: Directory of Other Design Aesthetics

### 1. Neo-Swiss / International Typographic Style

* **Swiss in CSS (Classic Swiss Posters Built with CSS Grid/Flexbox):** https://swissincss.com/
* **Grid Systems (Grid Architecture Documentation & Tools):** https://gridsystems.org/
* **IBM Carbon Design System (Enterprise Swiss Grid System):** https://carbondesignsystem.com/
* **Are.na (Search channels: `Swiss Design`, `Neo-Swiss`, `Liquid Glass UI`):** https://www.are.na/

### 2. Web/UI Aesthetics with Detailed Living Manuals

* **Neubrutalism (Living Manual):** https://neubrutalism.com/
* **Web Brutalism (Technical Manifesto & Guidelines):** https://brutalist-web.design/ | Gallery: https://brutalistwebsites.com/
* **Tufte CSS (Academic Editorial Minimalism):** https://edwardtufte.github.io/tufte-css/
* **Neumorphism (Soft UI Generator):** https://neumorphism.io/
* **Glassmorphism:** https://ui.glass/ | https://hype4.academy/tools/glassmorphism-generator
* **Claymorphism:** https://hype4.academy/tools/claymorphism-generator
* **Bento Grids:** https://bentogrids.com/

### 3. Retro OS & Nostalgic UI CSS Libraries

* **Windows 98 (`98.css`):** https://jdan.github.io/98.css/
* **Windows XP (`XP.css`):** https://botoxparty.github.io/XP.css/
* **Windows 7 (`7.css`):** https://khang-nd.github.io/7.css/
* **Classic Mac OS (`system.css`):** https://sakofchit.github.io/system.css/
* **8-Bit NES (`NES.css`):** https://nostalgic-css.github.io/NES.css/
* **Terminal / TUI (`Terminal CSS` & `TuiCss`):** https://terminalcss.xyz/ | https://vinibiavatti1.github.io/TuiCss/

### 4. Corporate Design Systems & Aesthetics Encyclopedias

* **Google Material Design 3:** https://m3.material.io/
* **Microsoft Fluent 2 Design System:** https://fluent2.microsoft.design/
* **FUI (Fantasy User Interfaces / Sci-Fi HUDs):** https://www.hudsandguis.com/
* **CARI (Consumer Aesthetics Research Institute):** https://cari.institute/aesthetics
* **Aesthetics Wiki (1,000+ Categorized Aesthetics):** https://aesthetics.fandom.com/
# CHANGELOG • NeoBank Global Cultural Design System

## [2.0.0] - Cultural Immersion & Complete Tokenization (2026-10-19)

### 🌍 Architectural Overview
Transformed NeoBank into an authentic, culturally immersive banking design system where selecting *any* of the 17 languages from the universal header dropdown re-themes the entire application in real time across both **Dark Mode** and **Light Mode**, with **zero hard-coded colors** remaining in component CSS, HTML, or JavaScript templates.

---

### 🏛️ Culture Themes Matrix (17 Supported Cultures)
Each culture theme implements a full 10-level tonal scale (`--brand-50` through `--brand-900`), semantic surface layers, cultural heritage motif backgrounds, typography, and browser chrome synchronization:

1. **English (en)**: Royal blue
   - Rule: "Flag blue. The only language allowed blue."
   - Dark: `#0B132B` base, `#131E3D` card, `#3B82F6` primary (White text)
   - Light: `#F0F4FC` base, `#DCE7F9` card, `#1D4ED8` primary (White text)
   - Motif: Modern diamond chain `◇ ◇ ◇ ◇ ◇ ◇`
2. **Spanish / Español (es)**: Gualda gold
   - Rule: "Red goes to China, so the flag's yellow band is used."
   - Dark: `#1C1910` base, `#2A2415` card, `#EAB308` primary (**Dark text** `#181202` for maximum legibility)
   - Light: `#FBF8EE` base, `#F7F0D8` card, `#EAB308` primary (**Dark text** `#1A1202`)
   - Motif: Sunburst rosettes `☼ ☼ ☼ ☼ ☼ ☼`
3. **French / Français (fr)**: Provence lavender
   - Rule: "Blue and red are taken, so Provence lavender is used."
   - Dark: `#161324` base, `#221C38` card, `#8B5CF6` primary (White text)
   - Light: `#F8F6FD` base, `#EDE8F9` card, `#5B21B6` primary (White text)
   - Motif: Cross florets `✤ ✤ ✤ ✤ ✤ ✤`
4. **German / Deutsch (de)**: Graphite and silver
   - Rule: "Red and gold are taken, so the flag's black is used."
   - Dark: `#141618` base, `#1E2226` card, `#E2E8F0` primary (**Dark text** `#0F172A`)
   - Light: `#F4F5F6` base, `#E3E6E8` card, `#18181B` primary (White text)
   - Motif: Geometric graphite squares `■ ■ ■ ■ ■ ■`
5. **Hindi / हिन्दी (hi)**: Saffron orange
   - Rule: "Flag saffron. Green is taken by Arabic."
   - Dark: `#1E140C` base, `#2C1E12` card, `#F97316` primary (**Dark text** `#1A0D03`)
   - Light: `#FFF8F0` base, `#FCEBD7` card, `#F97316` primary (**Dark text** `#1A0D03`)
   - Motif: Marigold blossoms `❀ ❀ ❀ ❀ ❀ ❀`
6. **Arabic / العربية (ar)**: Emerald green (**RTL Layout**)
   - Rule: "Flag green. The only language allowed green."
   - Dark: `#0A1C16` base, `#122B22` card, `#10B981` primary (**Dark text** `#032014`)
   - Light: `#F0F7F4` base, `#DCEFE7` card, `#065F46` primary (White text)
   - Motif: Diamond arrows `◆ ◆ ◆ ◆ ◆ ◆`
7. **Chinese / 中文 (zh / zh-CN)**: Scarlet red
   - Rule: "Flag red. The only language allowed red."
   - Dark: `#1A1112` base, `#291819` card, `#EF4444` primary (White text)
   - Light: `#FCF5F5` base, `#F7E5E5` card, `#B91C1C` primary (White text)
   - Motif: Traditional diamond fretwork `❖ ❖ ❖ ❖ ❖ ❖`
8. **Japanese / 日本語 (ja)**: Sakura pink
   - Rule: "Red is taken, so sakura pink is used."
   - Dark: `#1A1216` base, `#271A21` card, `#F9A8D4` primary (**Dark text** `#260715`)
   - Light: `#FAF5F7` base, `#F5E5EC` card, `#BE185D` primary (White text)
   - Motif: Double balance bars `= = = = = =`
9. **Russian / Русский (ru)**: Tea and samovar brown
   - Rule: "Blue and red are taken, so tea-brown is used."
   - Dark: `#1A1612` base, `#29211B` card, `#E6CCB2` primary (**Dark text** `#1C130B`)
   - Light: `#FAF7F2` base, `#EFE6D8` card, `#582F0E` primary (White text)
   - Motif: Snowflakes `❄ ❄ ❄ ❄ ❄ ❄`
10. **Portuguese / Português (pt)**: Terracotta
    - Rule: "Green, red and gold are taken, so terracotta is used."
    - Dark: `#1E1310` base, `#2D1C17` card, `#E07A5F` primary (White text)
    - Light: `#FAF5F2` base, `#F5E7DF` card, `#A8422B` primary (White text)
    - Motif: Azulejo diamonds `◈ ◈ ◈ ◈ ◈ ◈`
11. **Italian / Italiano (it)**: Tuscan olive
    - Rule: "Green and red are taken, so olive is used."
    - Dark: `#171A12` base, `#23271A` card, `#A3B18A` primary (**Dark text** `#161D0F`)
    - Light: `#F7F8F4` base, `#EBEEDF` card, `#586438` primary (White text)
    - Motif: Olive sprigs `🫒 🫒 🫒 🫒 🫒 🫒`
12. **Korean / 한국어 (ko)**: Goryeo celadon
    - Rule: "Red and blue are taken, so celadon is used."
    - Dark: `#101715` base, `#182420` card, `#74C69D` primary (**Dark text** `#091A14`)
    - Light: `#F2F7F5` base, `#E5EDE8` card, `#2D6A4F` primary (White text)
    - Motif: Dancheong moon phases `◐ ◐ ◐ ◐ ◐ ◐`
13. **Turkish / Türkçe (tr)**: Iznik turquoise
    - Rule: "Red is taken, so Iznik turquoise is used."
    - Dark: `#0A181C` base, `#10262C` card, `#22D3EE` primary (**Dark text** `#042027`)
    - Light: `#F0F8FA` base, `#DAEEF2` card, `#0891B2` primary (White text)
    - Motif: Ceramic tiles `❖ ❖ ❖ ❖ ❖ ❖`
14. **Dutch / Nederlands (nl)**: Tulip magenta
    - Rule: "Flag colours are taken, so tulip magenta is used."
    - Dark: `#1C0F18` base, `#2A1624` card, `#F43F5E` primary (White text)
    - Light: `#FAF2F6` base, `#F5DEEB` card, `#BE185D` primary (White text)
    - Motif: Tulips `⚘ ⚘ ⚘ ⚘ ⚘ ⚘`
15. **Bengali / বাংলা (bn)**: Padma river sky
    - Rule: "Green and red are taken, so river-sky cyan is used."
    - Dark: `#0A161E` base, `#10232F` card, `#38BDF8` primary (**Dark text** `#061D2B`)
    - Light: `#F0F6FA` base, `#DBEBF5` card, `#0284C7` primary (White text)
    - Motif: River stars `✻ ✻ ✻ ✻ ✻ ✻`
16. **Tamil / தமிழ் (ta)**: Silk maroon and jasmine ivory
    - Rule: "Saffron and green are taken, so silk maroon is used."
    - Dark: `#1C0D11` base, `#2A1319` card, `#FEF3C7` primary (**Silk maroon text** `#3B0A16`)
    - Light: `#FBF7F0` base, `#F7EEDC` card, `#800020` primary (White text)
    - Motif: Kolam diamonds `◆ ◆ ◆ ◆ ◆ ◆`
17. **Telugu / తెలుగు (te)**: Silk orchid purple
    - Rule: "Flag colours are taken, so silk purple is used."
    - Dark: `#160E22` base, `#221535` card, `#C084FC` primary (**Dark text** `#220738`)
    - Light: `#F8F4FB` base, `#EDE3F5` card, `#7E22CE` primary (White text)
    - Motif: Ikat stars `✦ ✦ ✦ ✦ ✦ ✦`

---

### 📦 Files Created
1. `frontend/css/themes.css`: Master multi-culture design token system (1,000+ lines) defining custom properties on `html[data-culture][data-theme]` with full tonal scales, semantic surfaces, text tokens, status indicators, cultural motifs, Google Fonts regional imports, and legacy 404 token bridge.
2. `frontend/js/theme.js`: Zero-FOUC synchronous runtime engine executing in `<head>` before first paint, exposing `window.NeobankTheme` (`getCulture`, `setCulture`, `getTheme`, `setTheme`, `toggleTheme`, `getThemeColor`, `subscribe`).
3. `frontend/html/theme-preview.html`: Comprehensive side-by-side interactive workbench demonstrating all 17 cultures across 6 live banking components.
4. `theme-preview.html`: Root mirror of the workbench for direct browser previews.
5. `CHANGELOG.md`: This comprehensive changelog document.

---

### 🛠️ Files Refactored
All component CSS, HTML, and JS files have had hard-coded hex, RGB, and RGBA values replaced with semantic CSS variables:

| File | Changes Made |
| :--- | :--- |
| `frontend/css/themes.css` | Defined 34 theme permutations (17 cultures x 2 modes), tonal brand scales, motifs, and legacy bridges. |
| `frontend/css/common.css` | Linked `@import url('themes.css')`, eliminated 74 hard-coded colors, delegated to design system. |
| `frontend/css/style.css` | Eliminated 583 hard-coded hex lines across banking cards, tables, inputs, and modals. |
| `frontend/css/sql_gui.css` | Eliminated 142 hard-coded colors; bridged `--db-*` tokens to standard design tokens. |
| `frontend/css/open_account_customer.css` | Eliminated 33 hard-coded colors across character cells and form sections. |
| `frontend/css/home.css` | Eliminated 26 hard-coded colors in hero gradients and feature panels. |
| `frontend/css/404.css` | Replaced legacy `:root` and light overrides with dynamic bridges to `var(--text-main)`, `var(--brand-500)`. |
| `frontend/css/index.css` | Eliminated 13 hard-coded colors across badge and table elements. |
| `frontend/css/login.css` | Eliminated 6 hard-coded colors in authentication views. |
| `frontend/css/neobank-ui.css` | Eliminated 5 hard-coded colors; switched to CSS variables. |
| `frontend/css/employee_onboarding.css` | Eliminated all hard-coded colors. |
| `frontend/css/existing_application.css` | Eliminated all hard-coded colors. |
| `frontend/js/i18n.js` | Synchronized `window.NeobankTheme.setCulture(lang)` across dropdown triggers and page initialization; guaranteed RTL syncing for Arabic. |
| `frontend/js/bank_form_renderer.js` | Converted 206 template color instances into CSS variables. |
| `frontend/js/customer.js` | Eliminated all inline style hex colors in card renderers. |
| `frontend/js/components.js` | Converted dock navigation and header badge inline styles to CSS tokens. |
| `frontend/html/404.html` | Updated Guilloche rosette and wave SVG canvas math to dynamically read active culture theme color. |
| `frontend/html/sql_gui.html` | Replaced query status inline DOM color changes with CSS variables. |
| `frontend/html/index.html` | Added `<link rel="stylesheet" href="/css/themes.css">` and tokenized signature pen strokes. |
| `frontend/html/open_account_customer.html` | Added `<link rel="stylesheet" href="/css/themes.css">` and tokenized signature pen strokes. |
| `backend/app/main.py` | Added `/theme-preview` and `/theme-preview.html` endpoints. |

---

### 🎨 Token Mapping Reference
- `var(--brand-50)` through `var(--brand-900)`: 10-level tonal scale
- `var(--brand-primary)`: Primary interactive action color
- `var(--brand-gradient)`: High-depth linear gradient matching the culture
- `var(--brand-glow)`: Ambient cultural drop shadow and focus glow
- `var(--brand-subtle)`: 15% opacity tint for badges, active pills, and focus rings
- `var(--bg-primary)`: App root canvas background
- `var(--bg-secondary)`: Recessed areas and toolbars
- `var(--bg-card)`: Elevated glassmorphic surfaces
- `var(--bg-panel)`: Secondary containment panels
- `var(--bg-raised)`: Top-tier elevated elements, table headers, and popovers
- `var(--text-main)`: High-contrast primary copy
- `var(--text-secondary)`: Descriptive body and subtitle text
- `var(--text-muted)`: Metadata, timestamps, and placeholder labels
- `var(--text-contrast)`: Pure white/high-contrast text on brand buttons
- `var(--border-subtle)`: 8% ambient border
- `var(--border-medium)`: 16% structural divider
- `var(--border-glow)`: Primary brand glow border
- `var(--bg-pattern)`: Cultural motif background

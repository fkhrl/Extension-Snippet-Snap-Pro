# Snippet Snap Pro 🚀
**A powerful browser extension to capture code snippets and inspect CSS on the fly.**

Snippet Snap Pro programmer-der jhamelamukto vabe code snippet save korte ebong website-er CSS property inspect korte sahajjo kore. Ete ache smart filtering jeta shudhu proyojoniyo class-based CSS dekhay.

---

## 🛠 Features
- **Smart CSS Inspector:** Jekono element-e click kore tar applied CSS (Class & Inline) instant dekha jay.
- **Selective CSS Filtering:** Browser-er default styles bad diye shudhu applied property-gulo show kore.
- **Smart Capturing:** Text select kore right-click menu-r madhyome instant save.
- **Lock & Copy:** Inspector tooltip-ti lock kore aramse CSS copy korar sujog.
- **Duplicate Prevention:** Ek-i code bar bar save hoye storage bhorat kora bondho kore.
- **Real-time Sync:** Popup open thakle refresh chharao snippet auto-update hoye jay.

---

## 🚀 Installation (Developer Mode)

1. Repository-ti **Clone** korun ba **ZIP** download kore extract korun.
2. Google Chrome browser-e `chrome://extensions/` e jan.
3. Top-right theke **Developer Mode** toggle-ti on korun.
4. **"Load unpacked"** button-e click korun.
5. Apnar extract kora folder-ti select korun. **Done!**

---

## 📂 Project Logic
Extension-ti ৩-ti mul layer-e kaj kore:

1. **Manifest (V3):** Extension-er permission (Storage, ContextMenus, Scripting) handle kore.
2. **Content Script:** Website-er bhetore CSS Inspector inject kore ebong DOM element theke styles collect kore.
3. **Background Worker:** Right-click menu toiri kora ebong notifications manage kore.
4. **Popup Interface:** Save kora snippet gulo list akare dekhay ebong CSS inspection data display kore.

---

## 📜 CSS Inspector Overview
Amader inspector ekhon nicher logic handle korche:
- `document.styleSheets`: Shudhu matro stylesheet-e thaka applied rules dhorte.
- `element.matches()`: Selector mapping-er madhyome exact CSS property filter kora.
- `Pointer-events`: Tooltip-er movement ebong locking mechanism control kora.

---

## 🤝 Contribution
Apni jodi kono notun feature (e.g. Cloud Sync ba Syntax Highlighting) add korte chan, tahole Pull Request pathate paren!

Made with ❤️ for the Developer fkhrl.
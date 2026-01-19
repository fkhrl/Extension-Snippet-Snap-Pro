# Snippet Snap Pro 🚀
**A powerful browser extension to capture and manage code snippets on the fly.**

Snippet Snap Pro programmer-der jhamelamukto vabe code snippet save korte sahajjo kore. Eta shudhu code save-i kore na, borong duplicate snippet detect kora ebong instant notification-er madhyome user-ke update janay.

---

## 🛠 Features
- **Smart Capturing:** Text select kore right-click menu-r madhyome instant save.
- **Duplicate Prevention:** Ek-i code bar bar save hoye storage bhorat kora bondho kore.
- **Smart Notifications:** Snippet save hole ba duplicate hole sundor notification dekhay.
- **Real-time Sync:** Popup open thakle refresh chharao snippet auto-update hoye jay.
- **Timestamp Tracking:** Protiti snippet kothay theke ebong kobe save kora hoyeche tar details thake.

---

## 🚀 Installation (Developer Mode)

Jehetu amra eta open-source rakhchi, install korte niche step-gulo follow korun:

1. Repository-ti **Clone** korun ba **ZIP** download kore extract korun.
2. Google Chrome browser-e `chrome://extensions/` e jan.
3. Top-right theke **Developer Mode** toggle-ti on korun.
4. **"Load unpacked"** button-e click korun.
5. Apnar folder-ti select korun. **Done!**

---

## 📂 Project Logic
Extension-ti ৩-ti mul layer-e kaj kore:

1. **Manifest (V3):** Extension-er permission (Storage, ContextMenus, Notifications) handle kore.
2. **Background Service Worker:** Right-click menu toiri kora, duplicate check kora, ebong notifications manage kore.
3. **Popup Interface:** User-er save kora snippet gulo list akare dekhay ebong clipboard-e copy korar sujog dey.

---

## 📜 Code Overview (Background Logic)
Amader background script ekhon nicher jinishgulo handle korche:
- `chrome.contextMenus`: Right-click option add korar jonno.
- `chrome.storage.local`: Local storage-e data permanent rakhar jonno.
- `chrome.notifications`: User-ke feedback dewar jonno.
- `chrome.runtime.sendMessage`: Popup-er shathe jogajog korar jonno.

---

## 🤝 Contribution
Apni jodi kono notun feature (e.g. Cloud Sync ba Tags) add korte chan, tahole Pull Request pathate paren!

Made with ❤️ for the Developer Community.
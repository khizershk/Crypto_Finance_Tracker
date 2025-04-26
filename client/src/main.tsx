import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add Remix Icon from CDN
const remixLink = document.createElement('link');
remixLink.href = "https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css";
remixLink.rel = "stylesheet";
document.head.appendChild(remixLink);

// Add page title
const titleElement = document.createElement('title');
titleElement.textContent = "CryptoTrack - Financial Dashboard";
document.head.appendChild(titleElement);

// Add Google Fonts
const fontsLink = document.createElement('link');
fontsLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
fontsLink.rel = "stylesheet";
document.head.appendChild(fontsLink);

createRoot(document.getElementById("root")!).render(<App />);

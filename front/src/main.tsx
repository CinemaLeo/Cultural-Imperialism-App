// main.tsx or index.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css"; // global styles
import "./App.css"; // component-specific overrides

import App from "./App.tsx";

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  console.error("Root element not found!");
}

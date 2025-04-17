import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";
import "./App.css";

import App from "./pages/index.tsx";
import GridPage from "./pages/gridPage.tsx";
import SideBySidePage from "./pages/side-by-sidePage.tsx";
const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/grid" element={<GridPage />} />
          <Route path="/side-by-side" element={<SideBySidePage />} />
        </Routes>
      </BrowserRouter>
    </StrictMode>
  );
} else {
  console.error("Root element not found!");
}

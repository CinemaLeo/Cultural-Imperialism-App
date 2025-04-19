import "../App.css";
import "../index.css";
import "bootstrap/dist/css/bootstrap.min.css";

import { useEffect } from "react";

import { TranslationProvider } from "../components/BroadcastTranslationContext.tsx";
import TranslationComponent from "../components/translation.tsx";
import MainDisplay from "../components/main_display.tsx";
import FullscreenToggle from "../components/FullscreenToggle.tsx";
import AutoTranslateToggle from "../components/AutoTranslateToggle.tsx";
import MobileCheck from "../components/MobileView.tsx";
import { BrowserView } from "react-device-detect";

export default function App() {
  useEffect(() => {
    // Disable scrolling on mount
    document.body.style.overflow = "hidden";

    return () => {
      // Re-enable scrolling when App is unmounted
      document.body.style.overflow = "auto";
    };
  }, []); // Function to open additional windows
  const openAdditionalWindows = () => {
    // Only run if we're the original window (not a popup)
    if (!window.opener) {
      window.open(
        `${window.location.origin}/grid`,
        "GridWindow",
        "width=1200,height=800"
      );
      window.open(
        `${window.location.origin}/side-by-side`,
        "SideBySideWindow",
        "width=1000,height=600"
      );
    }
  };

  return (
    <div>
      <MobileCheck />
      <BrowserView>
        <TranslationProvider>
          <FullscreenToggle />
          <div
            style={{
              position: "absolute",
              top: "70px",
              left: "-11.5px",
              opacity: 0.6,
            }}
          >
            <button
              onClick={openAdditionalWindows}
              style={{ marginTop: "2em" }}
            >
              ⮺
            </button>
          </div>
          <AutoTranslateToggle />
          <TranslationComponent />
          <MainDisplay />
        </TranslationProvider>
      </BrowserView>
    </div>
  );
}

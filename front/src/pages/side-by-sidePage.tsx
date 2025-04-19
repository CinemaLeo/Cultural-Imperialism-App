import "../App.css";
import "../index.css";

import { TranslationProvider } from "../components/BroadcastTranslationContext";
import SideBySideDisplay from "../components/side_by_side_display";
import FullscreenToggle from "../components/FullscreenToggle";
import { BrowserView } from "react-device-detect";
import MobileCheck from "../components/MobileView";

export default function SideBySidePage() {
  console.log("Side-by-side page rendering!");

  return (
    <div>
      <MobileCheck />
      <BrowserView>
        <TranslationProvider>
          <SideBySideDisplay />
          <FullscreenToggle />
        </TranslationProvider>
      </BrowserView>
    </div>
  );
}

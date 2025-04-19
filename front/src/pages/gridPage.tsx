import "../App.css";
import "../index.css";

import { TranslationProvider } from "../components/BroadcastTranslationContext";
import Grid from "../components/grid";
import FullscreenToggle from "../components/FullscreenToggle";
import { BrowserView } from "react-device-detect";
import MobileCheck from "../components/MobileView";

export default function GridPage() {
  console.log("Grid page rendering!");

  return (
    <div>
      <MobileCheck />
      <BrowserView>
        <TranslationProvider>
          <FullscreenToggle />

          <Grid />
        </TranslationProvider>
      </BrowserView>
    </div>
  );
}

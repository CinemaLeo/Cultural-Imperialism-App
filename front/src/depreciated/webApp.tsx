import "../App.css";
import "../index.css";

import { TranslationProvider } from "../depreciated/translationContext.tsx";
import Grid from "./grid.tsx";
import TranslationComponent from "./translation.tsx";
import MainDisplay from "./main_display.tsx";
import SideBySideDisplay from "./side_by_side_display.tsx";

function WebApp() {
  return (
    <TranslationProvider>
      <TranslationComponent />
      <MainDisplay />
      <SideBySideDisplay />
      <Grid />
    </TranslationProvider>
  );
}

export default WebApp;

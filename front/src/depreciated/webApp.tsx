import "../App.css";
import "../index.css";

import { TranslationProvider } from "../depreciated/translationContext.tsx";
import Grid from "../components/grid.tsx";
import TranslationComponent from "../components/translation.tsx";
import MainDisplay from "../components/main_display.tsx";
import SideBySideDisplay from "../components/side_by_side_display.tsx";

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

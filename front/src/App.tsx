import "bootstrap/dist/css/bootstrap.min.css";

import "./App.css";
import "./index.css";

import { TranslationProvider } from "./components/translationContext.tsx";
import Grid from "./components/grid.tsx";
import TranslationComponent from "./components/translation.tsx";
import MainDisplay from "./components/main_display.tsx";
import SideBySideDisplay from "./components/side_by_side_display.tsx";

function App() {
  return (
    <TranslationProvider>
      <TranslationComponent />
      <MainDisplay />
      <SideBySideDisplay />
      <Grid />
    </TranslationProvider>
  );
}

export default App;

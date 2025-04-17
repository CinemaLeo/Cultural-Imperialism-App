import { TranslationProvider } from "../components/BroadcastTranslationContext";
import SideBySideDisplay from "../components/side_by_side_display";
import FullscreenToggle from "../components/FullscreenToggle";
import "../App.css";
import "../index.css";

export default function SideBySidePage() {
  console.log("Side-by-side page rendering!");

  return (
    <TranslationProvider>
      <SideBySideDisplay />
      <FullscreenToggle />
    </TranslationProvider>
  );
}

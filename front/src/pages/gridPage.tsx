import React from "react";
import { TranslationProvider } from "../components/BroadcastTranslationContext";
import Grid from "../components/grid";
import FullscreenToggle from "../components/FullscreenToggle";
import "../App.css";
import "../index.css";

export default function GridPage() {
  console.log("Grid page rendering!");

  return (
    <TranslationProvider>
      <FullscreenToggle />

      <Grid />
    </TranslationProvider>
  );
}

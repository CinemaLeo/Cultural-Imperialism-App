// AutoTranslateToggle.tsx
import React from "react";
import { useTranslationContext } from "./BroadcastTranslationContext";

const AutoTranslateToggle: React.FC = () => {
  const { autoTranslate, setAutoTranslate } = useTranslationContext();

  return (
    <div style={{ position: "absolute", top: "-2px", left: "50px" }}>
      <button onClick={() => setAutoTranslate(!autoTranslate)}>
        {autoTranslate ? "auto" : "no auto"}
      </button>
    </div>
  );
};

export default AutoTranslateToggle;

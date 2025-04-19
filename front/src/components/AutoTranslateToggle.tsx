// AutoTranslateToggle.tsx
import React from "react";
import { useTranslationContext } from "./BroadcastTranslationContext";

const AutoTranslateToggle: React.FC = () => {
  const { autoTranslate, setAutoTranslate } = useTranslationContext();

  return (
    <div
      style={{ position: "absolute", top: "-2px", left: "50px", opacity: 0.6 }}
    >
      <button onClick={() => setAutoTranslate(!autoTranslate)}>
        {autoTranslate ? "auto" : "no auto"}
      </button>
    </div>
  );
};

export default AutoTranslateToggle;

import { useTranslationContext } from "./BroadcastTranslationContext";
import Typewriter from "typewriter-effect";
import { useEffect, useState, useRef } from "react";

export default function MainDisplay() {
  const { translations, is_translating } = useTranslationContext();
  const [localTranslations, setLocalTranslations] = useState(translations);
  const [shouldRenderOutput, setShouldRenderOutput] = useState(!is_translating);
  const translationsRef = useRef(translations);

  // Keep local translations updated while active
  useEffect(() => {
    // Update local translations if they change
    if (is_translating && translations.length > 0) {
      setLocalTranslations(translations);
      translationsRef.current = translations;
    }
    // clear translations when de-rendered
    if (!is_translating && !shouldRenderOutput) {
      setLocalTranslations([]);
    }
  }, [translations, is_translating]);

  // Handle transitions
  useEffect(() => {
    if (is_translating) {
      setShouldRenderOutput(true);
    } else {
      // Remove from DOM
      const timer = setTimeout(
        () => (setShouldRenderOutput(false), setLocalTranslations([])),
        5250
      ); // Set delay for fade out, make less than translation.tsx's fade_in_delay
      return () => clearTimeout(timer);
    }
  }, [is_translating]);

  // Cancel output if not showing
  if (!shouldRenderOutput) {
    console.log("Component not rendering");
    return null;
  }

  return (
    <div
      style={{
        opacity: is_translating ? 1 : 0,
        transition: "opacity 5s ease", //// Adjust transition duration; delay fade out must be longer.
      }}
    >
      {" "}
      {/* Fade out when not translating */}
      <div style={styles.container}>
        {localTranslations.map((t) => (
          <div key={t.index} style={styles.entry}>
            <div
              className="language"
              style={{ animation: "fadeIn 2s linear forwards" }}
            >
              {/*{t.index} {/*SHOW INDEX FOR BUG TESTING*/}
              {"    "}
              {t.output_language}
            </div>
            <div className="translation" style={{ fontSize: "5em" }}>
              <Typewriter
                options={{
                  strings: t.output_translation,
                  autoStart: true,
                  loop: false,
                  cursor: "",
                  delay: 75,
                }}
              />
            </div>
            <div className="backTranslation">
              {" "}
              <Typewriter
                options={{
                  autoStart: false,
                  loop: false,
                  cursor: "",
                  delay: 25,
                }}
                onInit={(typewriter) => {
                  typewriter
                    .pauseFor(1500)
                    .typeString(t.back_translation)
                    .start();
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "relative" as const,
    width: "100%",
    height: "75vh",
    overflow: "show",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "none",
    backgroundColor: "rgba(0, 0, 0, 0.0)",
  },
  entry: {
    position: "fixed" as const, // Formatting issues fixed with "fixed"
    width: "100%",
    textAlign: "center" as const,
    fontFamily: "'Noto', sans-serif",
    padding: "1em",
    animation: "fadeAndShrink 30s linear forwards", // Set fade duration
  },
};

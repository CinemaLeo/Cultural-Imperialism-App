import { useState, useEffect } from "react";
import { useTranslationContext } from "./BroadcastTranslationContext";
import Typewriter from "typewriter-effect";

// A simple 2-column layout
const SideBySideDisplay = () => {
  const { translations } = useTranslationContext();

  // Initial state with empty values
  const [originalTranslation, setOriginalTranslation] = useState<any>(null);
  const [currentTranslation, setCurrentTranslation] = useState<any>(null);

  useEffect(() => {
    if (translations.length == 0) {
      setOriginalTranslation(null);
      setCurrentTranslation(null);
      return;
    }
    if (translations.length > 0) {
      if (!originalTranslation) {
        setOriginalTranslation(translations[0]);
      }
      setCurrentTranslation(translations[translations.length - 1]);
    }
  }, [translations, originalTranslation]);

  if (!originalTranslation || !currentTranslation) {
    return <div></div>;
  }

  return (
    <div style={styles.container}>
      <div key={originalTranslation.output_translation} style={styles.column}>
        <div className="language" style={styles.language}>
          {originalTranslation.output_language}
        </div>
        <div className="translation" style={styles.translation}>
          <Typewriter
            options={{
              strings: originalTranslation.output_translation,
              autoStart: true,
              loop: false,
            }}
            onInit={(typewriter) => {
              typewriter
                .pauseFor(originalTranslation.output_translation.length * 2) // Optional pause after typing
                .callFunction(() => {
                  // Remove or hide the cursor after typing is done
                  const cursors =
                    document.getElementsByClassName("Typewriter__cursor");
                  for (let i = 0; i < cursors.length; i++) {
                    cursors[i].remove(); // or use style.display = 'none' to hide instead of removing
                  }
                })
                .start();
            }}
          />
        </div>
        <div className="backTranslation" style={styles.backTranslation}>
          {originalTranslation.back_translation}
        </div>
      </div>

      <div key={currentTranslation.output_translation} style={styles.column}>
        {translations.length > 1 && (
          <>
            <div className="language" style={styles.language}>
              {currentTranslation.output_language}
            </div>
            <div className="translation" style={styles.translation}>
              <Typewriter
                options={{
                  strings: currentTranslation.output_translation,
                  autoStart: true,
                  loop: false,
                  delay: 60,
                }}
              />
            </div>
            <div className="backTranslation" style={styles.backTranslation}>
              <Typewriter
                options={{
                  strings: currentTranslation.back_translation,
                  autoStart: false,
                  loop: false,
                  cursor: "",
                  delay: 25,
                }}
                onInit={(typewriter) => {
                  typewriter
                    .pauseFor(1500)
                    .typeString(currentTranslation.back_translation)
                    .start();
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    width: "100%",
    height: "100vh",
    padding: "1em",
    justifyContent: "space-between", // Make them side by side
  },
  column: {
    display: "flex",
    flexDirection: "column" as "column",
    justifyContent: "center",
    alignItems: "center",
    width: "50vw",
    flex: 1,
    padding: "10em",
    margin: "0 1em", // Space between columns
  },
  language: {
    fontSize: "1em",
    animation: "fadeIn 2s linear forwards",
  },
  translation: {
    fontSize: "3em",
    marginTop: "0.5em",
    marginBottom: "0.5em",
  },
  backTranslation: {
    fontSize: "1.25em",
    animation: "fadeIn 2s linear forwards",
  },
};

export default SideBySideDisplay;

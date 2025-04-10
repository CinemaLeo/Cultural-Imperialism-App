import { useState, useEffect } from "react";
import { useTranslationContext } from "./translationContext";

// A simple 2-column layout
const SideBySideDisplay = () => {
  const { translations } = useTranslationContext();

  // Initial state with empty values
  const [originalTranslation, setOriginalTranslation] = useState<any>(null);
  const [currentTranslation, setCurrentTranslation] = useState<any>(null);

  useEffect(() => {
    if (translations.length > 0) {
      if (!originalTranslation) {
        setOriginalTranslation(translations[0]);
      }
      setCurrentTranslation(translations[translations.length - 1]);
    }
  }, [translations, originalTranslation]);

  if (!originalTranslation || !currentTranslation) {
    return <div>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.column}>
        <div style={styles.language}>{originalTranslation.output_language}</div>
        <div style={styles.translation}>
          {originalTranslation.output_translation}
        </div>
        <div style={styles.backTranslation}>
          {originalTranslation.back_translation}
        </div>
      </div>
      <div style={styles.column}>
        <div style={styles.language}>{currentTranslation.output_language}</div>
        <div style={styles.translation}>
          {currentTranslation.output_translation}
        </div>
        <div style={styles.backTranslation}>
          {currentTranslation.back_translation}
        </div>
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
    flex: 1,
    padding: "1em",
    margin: "0 1em", // Space between columns
  },
  language: {
    fontFamily: "'Noto', sans-serif",
    fontSize: "1em",
    color: "#666",
  },
  translation: {
    fontFamily: "'Noto', sans-serif",
    fontSize: "3em",
    fontWeight: "bold",
    marginTop: "0.5em",
    marginBottom: "0.5em",
  },
  backTranslation: {
    fontFamily: "'Noto', sans-serif",
    fontSize: "1.25em",
    color: "#444",
  },
};

export default SideBySideDisplay;

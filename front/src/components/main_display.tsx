import { useTranslationContext } from "./translationContext";

export default function MainDisplay() {
  const { translations } = useTranslationContext();

  return (
    <div style={styles.container}>
      {translations.map((translation, i) => (
        <div key={i} style={styles.entry}>
          <div style={styles.language}>
            {translation.index}
            {translation.output_language}
          </div>
          <div style={styles.translation}>{translation.output_translation}</div>
          <div style={styles.backTranslation}>
            {translation.back_translation}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    position: "relative" as const,
    width: "100%",
    height: "100vh",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#rgba(0, 0, 0, 0)",
  },
  entry: {
    position: "absolute" as const,
    textAlign: "center" as const,
    fontFamily: "'Noto', sans-serif",
    padding: "1em",
    animation: "fadeAndShrink 30s ease-out forwards", // Set fade duration
  },
  language: {
    fontFamily: "'Noto', sans-serif",
    fontSize: "2em",
    color: "#666",
    textShadow: "2px 2px 2px rgba(0, 0, 0, 0.8)", // Black outline effect
    opacity: 0.8,
  },
  translation: {
    fontFamily: "'Noto', sans-serif",
    fontSize: "5em",
    fontWeight: "bold" as const,
    margin: "0.25em 0",
    textShadow: "5px 5px 5px rgba(0, 0, 0, 0.8)", // Black outline effect
    animation: "fadeShadow 3s ease-out forwards", // Set fade duration
  },
  backTranslation: {
    fontFamily: "'Noto', sans-serif",
    fontSize: "2.25em",
    color: "#444",
    textShadow: "2px 2px 2px rgba(0, 0, 0, 0.8)", // Black outline effect
    opacity: 0.9,
  },
};

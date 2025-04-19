import { useState, useEffect, useRef } from "react";
import { useTranslationContext } from "./BroadcastTranslationContext";
import { phrases } from "../assets/phrase_bank";

function TranslationComponent() {
  const {
    addTranslation,
    resetTranslations,
    setIsTranslating,
    is_translating,
    autoTranslate,
  } = useTranslationContext();

  const [inputText, setInputText] = useState(""); // To store user input
  const [outputLanguage, setOutputLanguage] = useState(""); // To store translated output
  const [outputTranslation, setOutputTranslation] = useState(""); // To store translated output
  const [backTranslation, setBackTranslation] = useState(""); // To store translated output
  const [loading, setLoading] = useState(false); // To track loading state
  const [error, setError] = useState<string | null>(null);

  ////////////////////////////////////////////////////////////////////
  // WEB SOCKET AND PASSING PACKETS
  ////////////////////////////////////////////////////////////////////

  // WebSocket specific states
  const [clientId, setClientId] = useState("");
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Disconnected");
  const [translations, setTranslations] = useState<any[]>([]);
  const [currentProgress, setCurrentProgress] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState<any>(null);

  const socketRef = useRef<WebSocket | null>(null);

  // Generate a random client ID on component mount
  useEffect(() => {
    const randomId = `user_${Math.random().toString(36).substring(2, 9)}`;
    setClientId(randomId);

    // Auto-connect WebSocket when component mounts
    connectWebSocket(randomId);

    // Clean up on component unmount
    return () => {
      disconnectWebSocket();
    };
  }, []);

  // Initialize WebSocket connection
  const connectWebSocket = (id: string) => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Create WebSocket connection
    const socket = new WebSocket(
      `wss://cinemaleo.vip/CulturalImperialism/ws/${id}`
    ); //LOCAL `ws://localhost:8000/ws/${id}`

    socket.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
      setStatus("Connected");
      setError(null);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received:", data);

      switch (data.type) {
        case "status":
          setStatus(data.message);
          break;

        case "detection":
          setDetectedLanguage({
            code: data.language,
            name: data.language_name,
            success: data.success,
          });
          break;

        case "progress":
          setCurrentProgress(data.message);
          break;

        case "translation":
          // Add new translation to the list
          setTranslations((prev) => [...prev, data.translation]);

          // Update the UI with the latest translation
          if (data.translation) {
            setOutputLanguage(data.translation.target_language_name);
            setOutputTranslation(data.translation.translated_text);
            setBackTranslation(data.translation.back_translation);
          }
          // Pipe data to translation context
          const newTranslation = {
            index: data.index,
            input_text: data.translation.input_text,
            output_language: data.translation.target_language_name,
            output_translation: data.translation.translated_text,
            back_translation: data.translation.back_translation,
          };
          addTranslation(newTranslation);
          break;

        case "translation_failed":
          setStatus(`Failed to translate to ${data.language_name}`);
          break;

        case "complete":
          setLoading(false);
          // setIsTranslating(false);
          setStatus("Translation completed");
          setCurrentProgress("");
          setInputText("");
          break;

        case "error":
          console.log("WebSocket error:", data.message);
          setError(data.message);
          setLoading(false);
          setIsTranslating(false);
          setInputText("");
          break;

        default:
          console.log("Unhandled message type:", data.type);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
      setStatus("Disconnected");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setStatus("Connection error");
      setError("WebSocket connection error. Please try again.");
      setLoading(false);
      setInputText("");
    };

    socketRef.current = socket;
  };

  const disconnectWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  };

  // Function to handle translation via WebSocket
  const handleTranslate = (customText?: string) => {
    const textToTranslate = customText || inputText;

    if (!textToTranslate.trim()) {
      setError("Please enter text to translate");
      return;
    } else if (textToTranslate.length < 2) {
      setError("Text too short. Please enter at least 2 characters.");
      return;
    }

    console.log("Translating:", inputText);

    if (!connected || !socketRef.current) {
      // Try to reconnect
      connectWebSocket(clientId);
      setError("Connecting... Please try again in a moment");
      return;
    }

    // Reset states
    setLoading(true);
    setIsTranslating(true);
    setError(null);
    setTranslations([]);
    resetTranslations();
    setDetectedLanguage(null);
    setCurrentProgress("");
    setOutputLanguage("");
    setOutputTranslation("");
    setBackTranslation("");

    // Send the text to translate
    try {
      socketRef.current.send(
        JSON.stringify({
          text: textToTranslate,
        })
      );
    } catch (err) {
      setError("Failed to send message. Connection might be closed.");
      setLoading(false);
      setIsTranslating(false);

      // Try to reconnect
      connectWebSocket(clientId);
    }
  };

  ////////////////////////////////////////////////////////////////////
  // AUTO TEXT
  ////////////////////////////////////////////////////////////////////
  const auto_submit_delay = 10000; // Delay before auto-submit
  const isTypingRef = useRef(false);
  const finalTranslateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const delay_before_sending = 2000; // Delay before sending the text
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (autoTranslate && !is_translating && !isTypingRef.current) {
      const timer = setTimeout(() => {
        const randomPhrase =
          phrases[Math.floor(Math.random() * phrases.length)];
        typeInInput(randomPhrase, 40);
      }, auto_submit_delay);

      // 2️⃣ Initialize the countdown in seconds
      setCountdown(Math.ceil(auto_submit_delay / 1000));

      // 3️⃣ Tick that countdown every second
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c !== null && c > 0) return c - 1;
          clearInterval(interval);
          return null;
        });
      }, 1000);

      // Cleanup both timers if anything changes
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
        setCountdown(null);
      };

      return () => clearTimeout(timer);
    }
  }, [autoTranslate, inputText, is_translating]);

  // Helper to pause X milliseconds during typing
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // New, simplified type‑in function
  const typeInInput = async (text: string, charDelay: number) => {
    isTypingRef.current = true;
    setInputText(""); // clear out old

    // Cancel any previous translate timeout
    if (finalTranslateTimerRef.current) {
      clearTimeout(finalTranslateTimerRef.current);
    }

    for (const char of text) {
      setInputText((prev) => prev + char);
      await wait(charDelay);
    }
    isTypingRef.current = false;

    finalTranslateTimerRef.current = setTimeout(() => {
      console.log("Sending auto-text", text);
      handleTranslate(text);
    }, delay_before_sending); // 300ms gives React time to finish all state updates
  };

  ////////////////////////////////////////////////////////////////////
  // TEXT INPUT
  ////////////////////////////////////////////////////////////////////

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [shouldRenderInput, setShouldRenderInput] = useState(!is_translating);

  // Update render status when is_translating changes
  useEffect(() => {
    if (!is_translating) {
      const timer = setTimeout(() => setShouldRenderInput(true), 6000); // Set fade_in_delay on  to input.
      return () => clearTimeout(timer);
    } else {
      // Remove from DOM after fade transition completes
      const timer = setTimeout(() => setShouldRenderInput(false), 3000); // Set fade_out_delay for transitioning from input.
      return () => clearTimeout(timer);
    }
  }, [is_translating]);

  // Focus the text input field
  useEffect(() => {
    const focusInterval = setInterval(() => {
      if (!shouldRenderInput)
        if (
          inputRef.current &&
          document.activeElement !== inputRef.current &&
          document.hasFocus()
        ) {
          inputRef.current.focus();
        }
    }, 1000); // Check every second
    return () => clearInterval(focusInterval); // Cleanup on unmount
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => 2000); // Set delay for fade out, make less than translation.tsx's fade_in_delay
    return () => clearTimeout(timer);
  }, [inputText]);

  return (
    <div>
      {/* Connection status indicator */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          marginBottom: "10px",
          fontSize: "0.8rem",
          color: connected ? "green" : "red",
          opacity: 0.6,
        }}
      >
        ⬤
      </div>
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 130,
          display: "flex",
          alignItems: "center",
        }}
      >
        {autoTranslate && countdown != null && (
          <span style={{ marginLeft: 8, fontSize: "0.8rem", opacity: 0.6 }}>
            ⏳ {countdown}
          </span>
        )}
      </div>

      {shouldRenderInput && (
        <div
          style={{
            display: "flex",
            alignItems: "center",

            justifyContent: "center",
            height: "100vh",

            opacity: !is_translating ? 1 : 0,
            transition: "opacity 3s ease",
            pointerEvents: !is_translating ? "auto" : "none",
          }}
        >
          <textarea
            autoFocus
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)} // TODO If not conncted, try to connect.
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // Prevents newline
                handleTranslate(); // Trigger your function
              }
            }}
            placeholder=""
            maxLength={150}
            style={styles.userinput}
          />
          {inputText.length > 2 && (
            <div
              style={{
                display: "absolute",
                position: "absolute",
                top: "75vh",
                alignContent: "center",
                fontFamily: "'Noto', sans-serif",
                fontSize: "3em",
                color: "rgba(255, 255, 255, 0.25)",
              }}
            >
              ⏎
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {/* DEBUG TRANS PROCESS 
      {currentProgress && (
        <div
          style={{
            margin: "10px 0",
            padding: "8px",
            backgroundColor: "#fff3cd",
            borderRadius: "4px",
          }}
        >
          <p>{currentProgress}</p>
        </div>
      )} */}
      {/* Detected language 
      {detectedLanguage && (
        <div style={{ margin: "10px 0" }}>
          <p>
            Detected Language: {detectedLanguage.name} ({detectedLanguage.code})
          </p>
        </div>
      )}*/}
      {/* Translation results 
      {outputLanguage && <p>Final Language: {outputLanguage}</p>}
      {outputTranslation && <p>Output Translation: {outputTranslation}</p>}
      {backTranslation && <p>Back Translate: {backTranslation}</p>}*/}
      {/* All translations (optional) */}
      {/*
      {translations.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>All Translations:</h3>
          {translations.map((translation, index) => (
            <div
              key={index}
              style={{
                marginBottom: "15px",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            >
              <p>
                <strong>From:</strong> {translation.source_language_name} →{" "}
                <strong>To:</strong> {translation.target_language_name}
              </p>
              <p>
                <strong>Original:</strong> {translation.original_text}
              </p>
              <p>
                <strong>Translation:</strong> {translation.translated_text}
              </p>
              <p>
                <strong>Back Translation:</strong>{" "}
                {translation.back_translation}
              </p>
            </div>
          ))} 
        </div>
      )}*/}
    </div>
  );
}

export default TranslationComponent;

const styles = {
  userinput: {
    width: "80vw",
    minHeight: "40vh",
    padding: "8px",
    marginBottom: "0px",
    outline: "none" as const,
    resize: "none" as const,

    backgroundColor: "rgba(255, 255, 255, 0)",
    border: "0px",

    textAlign: "center" as const,
    fontFamily: "'Noto', sans-serif",
    color: "#dfdfdf",
    fontSize: "3em",
    caretColor: "white",
    textShadow: "10px 10 black",
  },
};

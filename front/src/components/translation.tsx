import { useState, useEffect, useRef } from "react";
import { useTranslationContext } from "./translationContext";

function TranslationComponent() {
  const { addTranslation } = useTranslationContext();

  const [inputText, setInputText] = useState(""); // To store user input
  const [outputLanguage, setOutputLanguage] = useState(""); // To store translated output
  const [outputTranslation, setOutputTranslation] = useState(""); // To store translated output
  const [backTranslation, setBackTranslation] = useState(""); // To store translated output
  const [loading, setLoading] = useState(false); // To track loading state
  const [error, setError] = useState<string | null>(null);

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
    const socket = new WebSocket(`ws://localhost:8000/ws/${id}`);

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
          setStatus("Translation completed");
          setCurrentProgress("");
          break;

        case "error":
          setError(data.message);
          setLoading(false);
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
  const handleTranslate = () => {
    if (!inputText.trim()) {
      setError("Please enter text to translate");
      return;
    }

    if (!connected || !socketRef.current) {
      // Try to reconnect
      connectWebSocket(clientId);
      setError("Connecting... Please try again in a moment");
      return;
    }

    // Reset states
    setLoading(true);
    setError(null);
    setTranslations([]);
    setDetectedLanguage(null);
    setCurrentProgress("");
    setOutputLanguage("");
    setOutputTranslation("");
    setBackTranslation("");

    // Send the text to translate
    try {
      socketRef.current.send(
        JSON.stringify({
          text: inputText,
        })
      );
    } catch (err) {
      setError("Failed to send message. Connection might be closed.");
      setLoading(false);

      // Try to reconnect
      connectWebSocket(clientId);
    }
  };

  // Fallback to REST API if WebSocket fails
  const handleTranslateREST = async () => {
    setLoading(true);
    setError(null); // Reset previous error

    try {
      const response = await fetch("http://localhost:8000/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }), // Send the input text
      });

      // Check if the response is okay (status code 200)
      if (!response.ok) {
        throw new Error("Translation failed. Please try again.");
      }

      const data = await response.json();
      setOutputLanguage(data.output_language);
      setOutputTranslation(data.output_translation);
      setBackTranslation(data.back_translation);
    } catch (err: unknown) {
      // Type assertion to make sure 'err' is an instance of Error
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Connection status indicator */}
      <div
        style={{
          alignItems: "left",
          marginBottom: "10px",
          fontSize: "0.8rem",
          color: connected ? "green" : "red",
        }}
      >
        ⬤
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "90vh",
        }}
      >
        <textarea
          autoFocus
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
          style={{
            width: "100%",
            minHeight: "50vh",
            padding: "8px",
            marginBottom: "10px",
            outline: "none",
            resize: "none",

            backgroundColor: "rgba(255, 255, 255, 0)",
            border: "0px",

            textAlign: "center",
            fontFamily: "'Noto', sans-serif",
            fontSize: "3em",
            caretColor: "yellow",
            textShadow: "10px 10 black",
          }}
        />
        {inputText.length > 2 && (
          <div
            style={{
              display: "absolute",
              position: "absolute",
              top: "60vh",
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

      {/* Error message */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Translation progress 
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

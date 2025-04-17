import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

export type Translation = {
  index: number;
  input_text: string;
  output_language: string;
  output_translation: string;
  back_translation: string;
};

type TranslationContextType = {
  translations: Translation[];
  addTranslation: (newEntry: Translation) => void;
  resetTranslations: () => void;
  is_translating: boolean;
  setIsTranslating: (value: boolean) => void;
  autoTranslate: boolean;
  setAutoTranslate: (value: boolean) => void;
};

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

export const TranslationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [rawTranslations, setRawTranslations] = useState<Translation[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [is_translating, setIsTranslating] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(false);

  const channelRef = useRef<BroadcastChannel | null>(null);

  //////////////////////////////////////////////////////////////////////////////////
  //////// RECIEVE-BROADCASTING
  //////////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    channelRef.current = new BroadcastChannel("translation-channel");
    channelRef.current.onmessage = (event) => {
      const { type, payload } = event.data;
      switch (type) {
        case "ADD_TRANSLATION":
          setRawTranslations((prev) => {
            if (prev.some((t) => t.index === payload.index)) return prev;
            return [...prev, payload];
          });
          break;

        case "RENDER_TRANSLATION":
          console.log("Adding to RENDER_TRANSLATION:", payload);
          setTranslations((prev) => {
            if (prev.some((t) => t.index === payload.index)) return prev;
            return [...prev, payload];
          });
          break;

        case "RESET_TRANSLATIONS":
          console.log("Resetting translations (message received)");
          setRawTranslations([]);
          setTranslations([]);
          break;

        case "SYNC_REQUEST":
          if (channelRef.current && translations.length > 0) {
            channelRef.current.postMessage({
              type: "SYNC_RESPONSE",
              payload: translations,
            });
          }
          break;

        case "SYNC_RESPONSE":
          setTranslations((prev) => {
            const merged = [...prev];
            for (const t of payload) {
              if (!merged.some((x) => x.index === t.index)) merged.push(t);
            }
            return merged;
          });
          break;
      }
    };

    channelRef.current.postMessage({ type: "SYNC_REQUEST" });

    return () => {
      channelRef.current?.close();
    };
  }, []);

  //////////////////////////////////////////////////////////////////////////////////
  //////// RENDER QUEUE
  //////////////////////////////////////////////////////////////////////////////////

  const nextTimerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const finishTimerRef = useRef<number | null>(null);
  const minimum_render_delay = 3000;
  const maximum_render_delay = 10000;

  useEffect(() => {
    if (!is_translating) {
      // clean up if we ever stop translating
      if (nextTimerRef.current) {
        clearTimeout(nextTimerRef.current);
        nextTimerRef.current = null;
      }
      inFlightRef.current = false;
      return;
    }

    // still translating…
    const nextIndex = translations.length;
    const hasMore = nextIndex < rawTranslations.length;

    // only schedule if there is more to render, and no timer is pending:
    if (hasMore && !inFlightRef.current) {
      inFlightRef.current = true; // lock out further schedules

      const next = rawTranslations[nextIndex];
      const delay = Math.min(
        maximum_render_delay,
        Math.max(minimum_render_delay, next.output_translation.length * 100)
      );

      nextTimerRef.current = window.setTimeout(() => {
        setTranslations((prev) => {
          const updated = [...prev, next];
          channelRef.current?.postMessage({
            type: "RENDER_TRANSLATION",
            payload: next,
          });
          return updated;
        });

        // unlock so the next `translations.length` change will schedule again
        inFlightRef.current = false;
      }, delay);
    }

    // No cleanup here on rawTranslations changes! We want the timer to fire. Only teardown when is_translating flips false, handled above.
  }, [rawTranslations.length, translations.length, is_translating]);

  useEffect(() => {
    if (!is_translating) return;
    const final_render_delay = 10000; // Edit to change speed of final render
    if (
      rawTranslations.length > 0 &&
      translations.length === rawTranslations.length
    ) {
      finishTimerRef.current && clearTimeout(finishTimerRef.current);
      finishTimerRef.current = window.setTimeout(() => {
        setIsTranslating(false);
      }, final_render_delay); // Edit to change speed of final render
    }

    return () => {
      finishTimerRef.current && clearTimeout(finishTimerRef.current);
    };
  }, [translations.length, rawTranslations.length, is_translating]);

  useEffect(() => {
    if (!is_translating) {
      setRawTranslations([]);
      setTranslations([]);
      nextTimerRef.current && clearTimeout(nextTimerRef.current);
      finishTimerRef.current && clearTimeout(finishTimerRef.current);
    }
  }, [is_translating]);

  const addTranslation = (newEntry: Translation) => {
    setRawTranslations((prev) => [...prev, newEntry]);
    channelRef.current?.postMessage({
      type: "ADD_TRANSLATION",
      payload: newEntry,
    });
  };

  const resetTranslations = () => {
    channelRef.current?.postMessage({ type: "RESET_TRANSLATIONS" });
    setRawTranslations([]);
    setTranslations([]);
  };

  return (
    <TranslationContext.Provider
      value={{
        translations,
        addTranslation,
        resetTranslations,
        is_translating,
        setIsTranslating,
        autoTranslate,
        setAutoTranslate,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = () => {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error(
      "useTranslationContext must be used within a TranslationProvider"
    );
  }
  return ctx;
};

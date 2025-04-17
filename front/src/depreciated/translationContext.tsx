import React, { createContext, useContext, useState } from "react";

type Translation = {
  index: number;
  input_text: string;
  output_language: string;
  output_translation: string;
  back_translation: string;
};

type TranslationContextType = {
  translations: Translation[];
  addTranslation: (newEntry: Translation) => void;
  is_translating: boolean;
  setIsTranslating: (value: boolean) => void;
};

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

export const TranslationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [is_translating, setIsTranslating] = useState(false);

  const addTranslation = (newEntry: Translation) => {
    setTranslations((prev) => [...prev, newEntry]);
  };

  return (
    <TranslationContext.Provider
      value={{ translations, addTranslation, is_translating, setIsTranslating }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error(
      "useTranslationContext must be used within a TranslationProvider"
    );
  }
  return context;
};

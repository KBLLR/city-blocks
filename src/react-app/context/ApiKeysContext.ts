import { createContext, useContext } from "react";

export type ApiKeys = {
  openai: string;
  gemini: string;
  huggingface: string;
  ollama: string;
};

export interface ApiKeysContextValue {
  keys: ApiKeys;
  setKeys: (next: ApiKeys) => void;
  updateKey: (provider: keyof ApiKeys, value: string) => void;
  resetKeys: () => void;
}

const envDefaultKeys: ApiKeys = {
  openai: import.meta.env.VITE_OPENAI_API_KEY ?? "",
  gemini:
    import.meta.env.VITE_GENAI_API_KEY ??
    import.meta.env.VITE_GEMINI_API_KEY ??
    "",
  huggingface: import.meta.env.VITE_HUGGINGFACE_API_KEY ?? "",
  ollama: import.meta.env.VITE_OLLAMA_API_KEY ?? "",
};

const noop = () => {
  if (import.meta.env.DEV) {
    console.warn(
      "[ApiKeys] Attempted to modify API keys without an ApiKeysProvider. Wrap your tree with <ApiKeysProvider> to enable editing.",
    );
  }
};

const fallbackContextValue: ApiKeysContextValue = {
  keys: envDefaultKeys,
  setKeys: noop,
  updateKey: noop,
  resetKeys: noop,
};

export const ApiKeysContext = createContext<ApiKeysContextValue | undefined>(
  undefined,
);

export function getEnvApiKeys(): ApiKeys {
  return { ...envDefaultKeys };
}

export function useApiKeys(options?: {
  allowFallback?: boolean;
}): ApiKeysContextValue {
  const ctx = useContext(ApiKeysContext);
  if (ctx) return ctx;
  if (options?.allowFallback === false) {
    throw new Error("useApiKeys must be used within an ApiKeysProvider");
  }
  return fallbackContextValue;
}

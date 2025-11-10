import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ApiKeysContext,
  type ApiKeys,
  type ApiKeysContextValue,
  getEnvApiKeys,
} from "@/react-app/context/ApiKeysContext";

const STORAGE_KEY = "cityblocks:apiKeys";

const defaultKeys: ApiKeys = getEnvApiKeys();

function readFromStorage(): ApiKeys {
  if (typeof window === "undefined") return defaultKeys;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultKeys;
    const parsed = JSON.parse(raw) as Partial<ApiKeys>;
    return { ...defaultKeys, ...parsed };
  } catch {
    return defaultKeys;
  }
}

function writeToStorage(value: ApiKeys) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn("Failed to persist API keys", error);
  }
}

export function ApiKeysProvider({ children }: { children: ReactNode }) {
  const [keys, setKeysState] = useState<ApiKeys>(() => readFromStorage());

  const persist = useCallback((next: ApiKeys) => {
    setKeysState(next);
    writeToStorage(next);
  }, []);

  const setKeys = useCallback(
    (next: ApiKeys) => {
      persist(next);
    },
    [persist],
  );

  const updateKey = useCallback(
    (provider: keyof ApiKeys, value: string) => {
      persist({ ...keys, [provider]: value });
    },
    [keys, persist],
  );

  const resetKeys = useCallback(() => {
    persist(defaultKeys);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [persist]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (!event.newValue) {
        setKeysState(defaultKeys);
        return;
      }
      try {
        const parsed = JSON.parse(event.newValue) as Partial<ApiKeys>;
        setKeysState({ ...defaultKeys, ...parsed });
      } catch {
        setKeysState(defaultKeys);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const value = useMemo<ApiKeysContextValue>(
    () => ({
      keys,
      setKeys,
      updateKey,
      resetKeys,
    }),
    [keys, setKeys, updateKey, resetKeys],
  );

  return (
    <ApiKeysContext.Provider value={value}>
      {children}
    </ApiKeysContext.Provider>
  );
}

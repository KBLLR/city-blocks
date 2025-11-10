import { useState, useCallback } from "react";
import { useApiKeys } from "@/react-app/context/ApiKeysContext";

interface BuildingInfo {
  lat: number;
  lon: number;
  building_type: string;
  name?: string;
  addr_street?: string;
  addr_housenumber?: string;
  addr_city?: string;
  height?: number;
  levels?: number;
  tags: Record<string, string>;
}

interface AIBuildingResponse {
  name: string;
  description: string;
  original_tags: Record<string, string>;
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { keys } = useApiKeys();

  const generateBuildingInfo = useCallback(
    async (building: BuildingInfo): Promise<AIBuildingResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/building-info", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(keys.openai
              ? { "X-OpenAI-Key": keys.openai.trim() }
              : undefined),
            ...(keys.gemini
              ? { "X-Gemini-Key": keys.gemini.trim() }
              : undefined),
            ...(keys.huggingface
              ? { "X-HuggingFace-Key": keys.huggingface.trim() }
              : undefined),
            ...(keys.ollama
              ? { "X-Ollama-Key": keys.ollama.trim() }
              : undefined),
          },
          body: JSON.stringify({ building }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to generate building information"
          );
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("AI generation error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [keys]
  );

  return {
    generateBuildingInfo,
    loading,
    error,
  };
}

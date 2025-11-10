import { useMemo, useState, type ReactNode } from "react";
import { KeyRound, Eye, EyeOff, Trash2 } from "lucide-react";
import { ApiKeys, useApiKeys } from "@/react-app/context/ApiKeysContext";

const emptyKeys: ApiKeys = {
  openai: "",
  gemini: "",
  huggingface: "",
  ollama: "",
};

const providerMeta: Array<{
  id: keyof ApiKeys;
  label: string;
  placeholder: string;
  helper?: string;
}> = [
  {
    id: "openai",
    label: "OpenAI",
    placeholder: "sk-********",
    helper: "Used for GPT-4o building descriptions.",
  },
  {
    id: "gemini",
    label: "Gemini",
    placeholder: "AIzaSy********",
    helper: "Reserved for future LLM integrations.",
  },
  {
    id: "huggingface",
    label: "Hugging Face",
    placeholder: "hf_********",
  },
  {
    id: "ollama",
    label: "Ollama",
    placeholder: "Optional local token",
    helper: "Only required if using a remote Ollama endpoint.",
  },
];

type ApiKeyFabProps = {
  renderTrigger?: (options: { onOpen: () => void }) => ReactNode;
};

export function ApiKeyFab({ renderTrigger }: ApiKeyFabProps = {}) {
  const { keys, setKeys, resetKeys } = useApiKeys();
  const [open, setOpen] = useState(false);
  const [localValues, setLocalValues] = useState<ApiKeys>(keys);
  const [showValues, setShowValues] = useState(false);

  const hasChanges = useMemo(() => {
    return providerMeta.some(({ id }) => keys[id] !== localValues[id]);
  }, [keys, localValues]);

  const handleSave = () => {
    setKeys(localValues);
    setOpen(false);
  };

  const handleClose = () => {
    setLocalValues(keys);
    setOpen(false);
  };

  const openModal = () => {
    setLocalValues(keys);
    setOpen(true);
  };

  const trigger =
    renderTrigger?.({ onOpen: openModal }) ?? (
      <button
        type="button"
        aria-label="Open API key manager"
        className="fixed bottom-4 left-4 z-30 flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur transition hover:bg-slate-900"
        onClick={openModal}
      >
        <KeyRound size={16} />
        API Keys
      </button>
    );

  return (
    <>
      {trigger}

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-start bg-black/30 sm:items-center sm:justify-center">
          <div className="m-4 w-full max-w-md rounded-2xl bg-slate-950/95 p-6 text-white shadow-2xl ring-1 ring-white/10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">API Keys</h2>
              <button
                type="button"
                className="text-sm text-slate-300 hover:text-white"
                onClick={handleClose}
              >
                Close
              </button>
            </div>

            <p className="mb-4 text-sm text-slate-400">
              Keys are stored locally in your browser and sent only when a
              request needs that provider.
            </p>

            <div className="mb-4 flex items-center gap-2 text-sm text-slate-300">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 hover:border-white/40"
                onClick={() => setShowValues((v) => !v)}
              >
                {showValues ? <EyeOff size={14} /> : <Eye size={14} />}
                {showValues ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-red-500/30 px-3 py-1 text-red-300 hover:border-red-400 hover:text-red-200"
                onClick={() => {
                  setLocalValues(emptyKeys);
                  resetKeys();
                }}
              >
                <Trash2 size={14} />
                Clear all
              </button>
            </div>

            <div className="space-y-4">
              {providerMeta.map((provider) => (
                <label key={provider.id} className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-200">
                    {provider.label}
                  </span>
                  <input
                    type={showValues ? "text" : "password"}
                    value={localValues[provider.id]}
                    onChange={(event) =>
                      setLocalValues((prev) => ({
                        ...prev,
                        [provider.id]: event.target.value,
                      }))
                    }
                    placeholder={provider.placeholder}
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400 focus:border-cyan-400"
                  />
                  {provider.helper && (
                    <span className="mt-1 block text-xs text-slate-400">
                      {provider.helper}
                    </span>
                  )}
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2 text-sm">
              <button
                type="button"
                className="rounded-full px-4 py-2 text-slate-300 hover:text-white"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-cyan-500 px-4 py-2 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSave}
                disabled={!hasChanges}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect } from "react";
import { EyeIcon, EyeOffIcon } from "../icons";

interface AIConfig {
  provider: string;
  model: string;
  apiKey: string;
  apiEndpoint: string;
  label: string;
}

interface AIEvaluationSettingsProps {
  onSave?: (config: AIConfig) => void;
  onCancel?: () => void;
  availableTokens?: number;
}

const providerModels: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-4", label: "GPT-4 Turbo (Recommended)" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  ],
  anthropic: [
    { value: "claude-3-opus", label: "Claude 3 Opus" },
    { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
    { value: "claude-3-haiku", label: "Claude 3 Haiku" },
  ],
  google: [
    { value: "gemini-pro", label: "Gemini Pro" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  ],
};

const providerLabels: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
};

const STORAGE_KEY = "ai-evaluation-config";

export default function AIEvaluationSettings({
  onSave,
  onCancel,
  availableTokens = 8000,
}: AIEvaluationSettingsProps) {
  const [config, setConfig] = useState<AIConfig>({
    provider: "openai",
    model: "gpt-4",
    apiKey: "",
    apiEndpoint: "",
    label: "",
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved config", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    setConfig((prev) => ({
      ...prev,
      provider: newProvider,
      model: providerModels[newProvider]?.[0]?.value || "",
    }));
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConfig((prev) => ({ ...prev, model: e.target.value }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Omit<AIConfig, "provider" | "model">
  ) => {
    setConfig((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleClearField = (field: keyof Omit<AIConfig, "provider" | "model">) => {
    setConfig((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    onSave?.(config);
  };

  const currentModels = providerModels[config.provider] || [];

  const inputClass =
    "w-full px-4 py-3 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm";

  const selectClass =
    "w-full px-4 py-3 pr-10 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm appearance-none cursor-pointer";

  const labelClass = "block text-sm font-semibold text-slate-900 mb-2.5";

  if (!isLoaded) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* LEFT COLUMN - CONFIGURATION FORM */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg border border-slate-200 p-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              AI Evaluation Configuration
            </h2>
            <p className="text-slate-500 text-sm">
              Configure the underlying models used for grading and student feedback.
            </p>
          </div>

          <div className="space-y-6">
            {/* Row 1: Provider + Model */}
            <div className="grid grid-cols-2 gap-6">
              {/* Provider */}
              <div>
                <label className={labelClass}>API Provider</label>
                <div className="relative">
                  <select
                    value={config.provider}
                    onChange={handleProviderChange}
                    className={selectClass}
                  >
                    {Object.entries(providerLabels).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Model */}
              <div>
                <label className={labelClass}>Model Selection</label>
                <div className="relative">
                  <select
                    value={config.model}
                    onChange={handleModelChange}
                    className={selectClass}
                  >
                    {currentModels.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: API Key */}
            <div>
              <label className={labelClass}>API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={config.apiKey}
                  onChange={(e) => handleInputChange(e, "apiKey")}
                  placeholder="Enter your API key"
                  className={inputClass}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {config.apiKey && (
                    <button
                      type="button"
                      onClick={() => handleClearField("apiKey")}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      title="Clear field"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    {showApiKey ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Your key is encrypted and stored securely.
              </p>
            </div>

            {/* Row 3: Endpoint + Label */}
            <div className="grid grid-cols-2 gap-6">
              {/* API Endpoint */}
              <div>
                <label className={labelClass}>API Endpoint</label>
                <div className="relative">
                  <input
                    type="url"
                    value={config.apiEndpoint}
                    onChange={(e) => handleInputChange(e, "apiEndpoint")}
                    placeholder="https://api.openai.com/v1"
                    className={inputClass}
                  />
                  {config.apiEndpoint && (
                    <button
                      type="button"
                      onClick={() => handleClearField("apiEndpoint")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Clear field"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Label */}
              <div>
                <label className={labelClass}>Configuration Label</label>
                <div className="relative">
                  <input
                    type="text"
                    value={config.label}
                    onChange={(e) => handleInputChange(e, "label")}
                    placeholder="e.g. Production Grading"
                    className={inputClass}
                  />
                  {config.label && (
                    <button
                      type="button"
                      onClick={() => handleClearField("label")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Clear field"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer / Buttons */}
          <div className="flex justify-end items-center gap-3 mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 text-sm font-semibold rounded-md transition-all bg-blue-600 text-white hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - TOKEN AVAILABILITY SIDEBAR */}
      <div className="lg:col-span-1">
        <div className="sticky p-6 bg-white border top-32 rounded-2xl border-slate-200">
          
          {/* HEADER */}
          <h3 className="mb-6 text-lg font-bold text-slate-900">Token Availability</h3>

          {/* AVAILABLE TOKENS */}
          <div className="pb-6 mb-6 border-b border-slate-200">
            <p className="mb-2 text-sm text-slate-600">Available Tokens</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-blue-600">{availableTokens.toLocaleString()}</p>
              <p className="text-xs text-slate-500 font-medium">AI Evaluation Tokens</p>
            </div>
          </div>

          {/* USAGE INFO */}
          <div className="pb-6 mb-6 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-900 mb-3">Usage Information</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Model</span>
                <span className="text-xs font-semibold text-slate-900">
                  {config.model || "Not selected"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Provider</span>
                <span className="text-xs font-semibold text-slate-900">
                  {providerLabels[config.provider] || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Estimated Cost</span>
                <span className="text-xs font-semibold text-blue-600">$0.002 per use</span>
              </div>
            </div>
          </div>

          {/* TOKEN BREAKDOWN */}
          <div className="pb-6 mb-6 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-900 mb-3">Token Breakdown</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Used in evaluations</span>
                <span className="font-semibold text-slate-900">2,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pending evaluations</span>
                <span className="font-semibold text-slate-900">500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Reserved</span>
                <span className="font-semibold text-slate-900">1,500</span>
              </div>
            </div>
          </div>

          {/* INFO TEXT */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-blue-700">Note:</span> Ensure adequate tokens are available before running bulk evaluations. Tokens are replenished through the Credit Purchase page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

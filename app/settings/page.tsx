"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Key, Save, Check, AlertCircle, ExternalLink, Shield, Sparkles, Cpu, ChevronDown } from "lucide-react";
import { AVAILABLE_MODELS, DEFAULT_MODEL } from "@/lib/openai-client";

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState("");
    const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [hasKey, setHasKey] = useState(false);

    useEffect(() => {
        const savedKey = localStorage.getItem("openai_api_key");
        const savedModel = localStorage.getItem("openai_model");

        if (savedKey) {
            setApiKey(savedKey);
            setHasKey(true);
        }
        if (savedModel) {
            setSelectedModel(savedModel);
        }
    }, []);

    const handleSave = () => {
        if (!apiKey.trim()) {
            setError("Please enter an API key");
            return;
        }

        if (!apiKey.startsWith("sk-")) {
            setError("Invalid API key format. Should start with 'sk-'");
            return;
        }

        localStorage.setItem("openai_api_key", apiKey);
        localStorage.setItem("openai_model", selectedModel);
        setSaved(true);
        setHasKey(true);
        setError("");

        setTimeout(() => setSaved(false), 3000);
    };

    const handleClear = () => {
        localStorage.removeItem("openai_api_key");
        localStorage.removeItem("openai_model");
        setApiKey("");
        setSelectedModel(DEFAULT_MODEL);
        setHasKey(false);
    };

    return (
        <div className="min-h-screen bg-gradient-subtle font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-slate-200/50">
                <div className="flex items-center justify-between px-6 md:px-8 py-4 max-w-7xl mx-auto w-full">
                    <Link href="/" className="flex items-center gap-3 group">
                        <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">3Q</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900">3Quotes</span>
                        </div>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
                    <p className="text-slate-500">Configure your API keys and preferences</p>
                </div>

                {/* Status Card */}
                {hasKey && (
                    <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="font-semibold text-green-800">API Key Configured</div>
                            <div className="text-sm text-green-600">AI-powered quotes are enabled</div>
                        </div>
                    </div>
                )}

                {/* API Key Section */}
                <Card className="p-6 md:p-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <Key className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-1">OpenAI API Key</h2>
                            <p className="text-slate-500">Required for AI-powered quote generation</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label htmlFor="apiKey" className="block text-sm font-semibold text-slate-700 mb-2">
                                API Key
                            </label>
                            <input
                                id="apiKey"
                                type="password"
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    setError("");
                                }}
                                placeholder="sk-proj-..."
                                className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 text-slate-900 placeholder:text-slate-400 transition-all"
                            />
                            {error && (
                                <div className="flex items-center gap-2 mt-3 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        {/* Info Box */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-semibold text-slate-700 mb-1">Security Note</div>
                                    <p className="text-sm text-slate-500">
                                        Your API key is stored locally in your browser and never sent to our servers.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-semibold text-slate-700 mb-1">Don't have an API key?</div>
                                <a
                                    href="https://platform.openai.com/api-keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                >
                                    Get one from OpenAI
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Model Selection Section */}
                <Card className="p-6 md:p-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-1">AI Model</h2>
                            <p className="text-slate-500">Choose the OpenAI model for quote generation</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {AVAILABLE_MODELS.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => setSelectedModel(model.id)}
                                className={`w-full p-4 text-left border-2 rounded-xl transition-all ${selectedModel === model.id
                                    ? "border-purple-600 bg-purple-50 ring-1 ring-purple-600"
                                    : "border-slate-200 bg-white hover:border-purple-300 hover:bg-slate-50"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`font-semibold ${selectedModel === model.id ? "text-purple-700" : "text-slate-900"}`}>
                                                {model.name}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${model.category === "Recommended"
                                                    ? "bg-green-100 text-green-700"
                                                    : model.category === "Reasoning"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : model.category === "Fast"
                                                            ? "bg-amber-100 text-amber-700"
                                                            : "bg-slate-100 text-slate-600"
                                                }`}>
                                                {model.category}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-500 mt-1">{model.description}</div>
                                    </div>
                                    {selectedModel === model.id && (
                                        <Check className="w-5 h-5 text-purple-600 flex-shrink-0 ml-2" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Save Button */}
                <div className="flex gap-3">
                    <Button
                        onClick={handleSave}
                        className={`flex-1 h-14 text-base font-semibold rounded-xl transition-all btn-shine ${saved
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                            } shadow-lg shadow-blue-500/25`}
                    >
                        {saved ? (
                            <>
                                <Check className="w-5 h-5 mr-2" />
                                Settings Saved!
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                Save Settings
                            </>
                        )}
                    </Button>
                    {hasKey && (
                        <Button
                            onClick={handleClear}
                            variant="outline"
                            className="h-14 px-6 font-semibold rounded-xl border-2 border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
                        >
                            Clear All
                        </Button>
                    )}
                </div>

                {/* Back to Home */}
                <div className="mt-8 text-center">
                    <Link href="/" className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </main>
        </div>
    );
}

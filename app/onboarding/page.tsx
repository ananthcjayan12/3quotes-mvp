"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Home, Building2, Factory, Loader2, Settings, ArrowLeft, Sparkles, CheckCircle2, Key, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNextStep, type StepResponse, type NextStep } from "@/lib/openai-client";

const MAX_STEPS = 5;

const projectTypes = [
    { id: "residential", name: "Residential", description: "Homes & apartments", icon: Home, color: "from-orange-500 to-amber-500" },
    { id: "commercial", name: "Commercial", description: "Offices & retail", icon: Building2, color: "from-blue-500 to-cyan-500" },
    { id: "industrial", name: "Industrial", description: "Factories & warehouses", icon: Factory, color: "from-slate-600 to-slate-800" },
];

function OnboardingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // State
    const [category, setCategory] = useState<string | null>(searchParams.get("category") || null);
    const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
    const [currentStepData, setCurrentStepData] = useState<NextStep | null>(null);
    const [loading, setLoading] = useState(false);
    const [answer, setAnswer] = useState("");
    const [needsApiKey, setNeedsApiKey] = useState(false);
    const [apiError, setApiError] = useState(false);

    // Get API key from localStorage
    const getApiKey = (): string | undefined => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("openai_api_key") || undefined;
        }
        return undefined;
    };

    // Initial load or transition from Category Selection
    useEffect(() => {
        if (category && history.length === 0 && !currentStepData && !needsApiKey) {
            fetchNextStep();
        }
    }, [category]);

    const fetchNextStep = async () => {
        if (!category) return;
        setLoading(true);
        setApiError(false);

        try {
            const apiKey = getApiKey();
            const response = await getNextStep(history, category, apiKey);

            if (!response.success) {
                if (response.error === "NO_API_KEY") {
                    setNeedsApiKey(true);
                } else {
                    setApiError(true);
                }
                setLoading(false);
                return;
            }

            const step = response.data;
            if (step.type === "quote" && step.quote) {
                const quoteString = encodeURIComponent(JSON.stringify(step.quote));
                router.push(`/estimate?data=${quoteString}`);
            } else {
                setCurrentStepData(step);
            }
        } catch (e) {
            console.error(e);
            setApiError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySelect = (id: string) => {
        setCategory(id);
    };

    const handleNext = () => {
        if (currentStepData?.type === "question" && answer) {
            const newHistory = [
                ...history,
                { question: currentStepData.question!.text, answer },
            ];
            setHistory(newHistory);
            setAnswer("");
            setCurrentStepData(null);

            setLoading(true);
            setApiError(false);

            const apiKey = getApiKey();
            getNextStep(newHistory, category!, apiKey).then((response) => {
                if (!response.success) {
                    if (response.error === "NO_API_KEY") {
                        setNeedsApiKey(true);
                    } else {
                        setApiError(true);
                    }
                    setLoading(false);
                    return;
                }

                const step = response.data;
                if (step.type === "quote" && step.quote) {
                    const quoteString = encodeURIComponent(JSON.stringify(step.quote));
                    router.push(`/estimate?data=${quoteString}`);
                } else {
                    setCurrentStepData(step);
                }
                setLoading(false);
            });
        }
    };

    // Render API Key Required Screen
    if (needsApiKey) {
        return (
            <div className="min-h-screen bg-gradient-subtle flex flex-col font-sans">
                <Header showBack />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg animate-fade-in">
                        <Card className="p-8 md:p-10 shadow-xl border-0 bg-white/90 backdrop-blur-sm text-center">
                            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-6">
                                <Key className="w-8 h-8 text-amber-600" />
                            </div>

                            <h1 className="text-2xl font-bold text-slate-900 mb-3">
                                API Key Required
                            </h1>

                            <p className="text-slate-500 mb-8">
                                To generate AI-powered quotes, you need to configure your OpenAI API key in the settings.
                            </p>

                            <div className="space-y-3">
                                <Link href="/settings" className="block">
                                    <Button className="w-full h-12 font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 btn-shine">
                                        <Key className="w-4 h-4 mr-2" />
                                        Configure API Key
                                    </Button>
                                </Link>
                                <Link href="/" className="block">
                                    <Button variant="outline" className="w-full h-12 font-semibold rounded-xl border-2 border-slate-200">
                                        Back to Home
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Render API Error Screen
    if (apiError) {
        return (
            <div className="min-h-screen bg-gradient-subtle flex flex-col font-sans">
                <Header showBack />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg animate-fade-in">
                        <Card className="p-8 md:p-10 shadow-xl border-0 bg-white/90 backdrop-blur-sm text-center">
                            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>

                            <h1 className="text-2xl font-bold text-slate-900 mb-3">
                                Something Went Wrong
                            </h1>

                            <p className="text-slate-500 mb-8">
                                There was an error generating your quote. Please check your API key and try again.
                            </p>

                            <div className="space-y-3">
                                <Button
                                    onClick={() => { setApiError(false); fetchNextStep(); }}
                                    className="w-full h-12 font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                >
                                    Try Again
                                </Button>
                                <Link href="/settings" className="block">
                                    <Button variant="outline" className="w-full h-12 font-semibold rounded-xl border-2 border-slate-200">
                                        Check Settings
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Render Category Selection (Step 1)
    if (!category) {
        return (
            <div className="min-h-screen bg-gradient-subtle flex flex-col font-sans">
                <Header showBack />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl animate-fade-in">
                        <Card className="p-8 md:p-10 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                            <div className="space-y-8">
                                <ProgressBar progress={10} step={1} totalSteps={MAX_STEPS} />

                                <div className="text-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-4">
                                        <Sparkles className="w-3 h-3" />
                                        AI-Powered Analysis
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                                        What type of project is this?
                                    </h1>
                                    <p className="text-slate-500">
                                        Select the option that best describes your needs
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
                                    {projectTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => handleCategorySelect(type.id)}
                                            className="card-hover flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all outline-none border-slate-200 hover:border-blue-400 bg-white hover:shadow-lg group"
                                        >
                                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                                                <type.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                                            </div>
                                            <span className="font-semibold text-slate-900 mb-1">{type.name}</span>
                                            <span className="text-xs text-slate-500">{type.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate current step (1-based, capped at MAX_STEPS)
    const currentStep = Math.min(history.length + 1, MAX_STEPS);
    const progressPercent = Math.min(20 + (history.length * 18), 95);

    // Render AI Steps
    return (
        <div className="min-h-screen bg-gradient-subtle flex flex-col font-sans">
            <Header showBack />
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl animate-fade-in">
                    <Card className="p-8 md:p-10 shadow-xl border-0 bg-white/90 backdrop-blur-sm min-h-[450px] flex flex-col">
                        <div className="space-y-6 flex-1 flex flex-col">
                            <ProgressBar
                                progress={progressPercent}
                                step={currentStep}
                                totalSteps={MAX_STEPS}
                            />

                            {loading ? (
                                <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-fade-in">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                        </div>
                                        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-blue-200 animate-ping opacity-20" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-900 font-medium mb-1">Analyzing your needs...</p>
                                        <p className="text-slate-500 text-sm">Our AI is preparing the next question</p>
                                    </div>
                                </div>
                            ) : currentStepData?.type === "question" ? (
                                <div className="flex-1 flex flex-col justify-center animate-fade-in">
                                    <div className="text-center mb-8">
                                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed">
                                            {currentStepData.question?.text}
                                        </h1>
                                    </div>

                                    <div className="max-w-md mx-auto w-full">
                                        {currentStepData.question?.inputType === "select" && currentStepData.question.options ? (
                                            <div className="grid gap-3">
                                                {currentStepData.question.options.map((opt, idx) => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => setAnswer(opt)}
                                                        className={cn(
                                                            "w-full p-4 text-left border-2 rounded-xl transition-all font-medium flex items-center justify-between group",
                                                            answer === opt
                                                                ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md"
                                                                : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                                                        )}
                                                        style={{ animationDelay: `${idx * 0.05}s` }}
                                                    >
                                                        <span>{opt}</span>
                                                        {answer === opt && (
                                                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <input
                                                type={currentStepData.question?.inputType === "number" ? "number" : "text"}
                                                className="w-full p-4 text-lg border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 text-slate-900 placeholder:text-slate-400 transition-all"
                                                placeholder="Type your answer..."
                                                value={answer}
                                                onChange={(e) => setAnswer(e.target.value)}
                                                autoFocus
                                                onKeyDown={(e) => e.key === "Enter" && answer && handleNext()}
                                            />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1" />
                            )}

                            {!loading && (
                                <div className="pt-4">
                                    <Button
                                        className={cn(
                                            "w-full h-14 text-base font-semibold rounded-xl transition-all btn-shine",
                                            answer
                                                ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25"
                                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                        )}
                                        disabled={!answer}
                                        onClick={handleNext}
                                    >
                                        Continue
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function Header({ showBack = false }: { showBack?: boolean }) {
    return (
        <header className="sticky top-0 z-50 glass border-b border-slate-200/50">
            <div className="flex items-center justify-between px-6 md:px-8 py-4 max-w-7xl mx-auto w-full">
                <Link href="/" className="flex items-center gap-3 group">
                    {showBack && (
                        <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    )}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">3Q</span>
                        </div>
                        <span className="text-xl font-bold text-slate-900">3Quotes</span>
                    </div>
                </Link>
                <Link href="/settings">
                    <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                        <Settings className="w-5 h-5" />
                    </Button>
                </Link>
            </div>
        </header>
    );
}

function ProgressBar({ progress, step, totalSteps }: { progress: number; step: number; totalSteps: number }) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700">Step {step} of {totalSteps}</span>
                <span className="text-slate-500">{Math.round(progress)}% complete</span>
            </div>
            <div className="relative">
                <Progress value={Math.min(progress, 100)} className="h-2" />
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
                <div className="animate-pulse text-slate-400">Loading...</div>
            </div>
        }>
            <OnboardingContent />
        </Suspense>
    );
}

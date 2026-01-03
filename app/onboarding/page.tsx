"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Home, Building2, Factory, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNextStep } from "@/app/actions";
import type { NextStep } from "@/lib/openai";

const projectTypes = [
    { id: "residential", name: "Residential", icon: Home },
    { id: "commercial", name: "Commercial", icon: Building2 },
    { id: "industrial", name: "Industrial", icon: Factory },
];

export default function OnboardingPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // State
    const [category, setCategory] = useState<string | null>(searchParams.get("category") || null);
    const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
    const [currentStepData, setCurrentStepData] = useState<NextStep | null>(null);
    const [loading, setLoading] = useState(false);
    const [answer, setAnswer] = useState("");

    // Initial load or transition from Category Selection
    useEffect(() => {
        if (category && history.length === 0 && !currentStepData) {
            fetchNextStep();
        }
    }, [category]);

    const fetchNextStep = async () => {
        if (!category) return;
        setLoading(true);
        try {
            const step = await getNextStep(history, category);

            if (step.type === "quote" && step.quote) {
                // Redirect to estimate page with quote data
                // For MVP, we'll encode it in URL (in prod, use DB/Store)
                const quoteString = encodeURIComponent(JSON.stringify(step.quote));
                router.push(`/estimate?data=${quoteString}`);
            } else {
                setCurrentStepData(step);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySelect = (id: string) => {
        setCategory(id);
        // Proceed to fetch first question
    };

    const handleNext = () => {
        if (currentStepData?.type === "question" && answer) {
            const newHistory = [
                ...history,
                { question: currentStepData.question!.text, answer },
            ];
            setHistory(newHistory);
            setAnswer("");
            setCurrentStepData(null); // Clear current to show loading/next

            // Trigger next fetch
            // We manually call it here because the effect depends on empty history/data state which is tricky
            // But actually, we can just call the async function directly with the new history

            // Re-implement simplified fetch:
            setLoading(true);
            getNextStep(newHistory, category!).then((step) => {
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

    // Render Category Selection (Step 1)
    if (!category) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
                <Header />
                <div className="flex-1 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl p-8 shadow-xl border-0 bg-white">
                        <div className="space-y-6">
                            <ProgressBar progress={10} step={1} />
                            <div className="text-center py-8">
                                <h1 className="text-2xl font-bold text-slate-900 mb-8">
                                    What type of project is this?
                                </h1>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {projectTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => handleCategorySelect(type.id)}
                                            className="flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all outline-none border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50"
                                        >
                                            <type.icon className="w-10 h-10 mb-3 text-blue-600" strokeWidth={1.5} />
                                            <span className="font-medium text-slate-900">{type.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // Render AI Steps
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header />
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl p-8 shadow-xl border-0 bg-white min-h-[400px] flex flex-col">
                    <div className="space-y-6 flex-1 flex flex-col">
                        {/* Progress increases as we go */}
                        <ProgressBar progress={25 + (history.length * 15)} step={1 + history.length} />

                        {loading ? (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                                <p className="text-slate-500 font-medium">Analyzing your needs...</p>
                            </div>
                        ) : currentStepData?.type === "question" ? (
                            <div className="flex-1 flex flex-col justify-center">
                                <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">
                                    {currentStepData.question?.text}
                                </h1>

                                <div className="max-w-md mx-auto w-full">
                                    {currentStepData.question?.inputType === "select" && currentStepData.question.options ? (
                                        <div className="grid gap-3">
                                            {currentStepData.question.options.map((opt) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setAnswer(opt)}
                                                    className={cn(
                                                        "w-full p-4 text-left border rounded-lg hover:border-blue-500 transition-colors",
                                                        answer === opt ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-200"
                                                    )}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <input
                                            type={currentStepData.question?.inputType === "number" ? "number" : "text"}
                                            className="w-full p-4 text-lg border-2 border-slate-200 rounded-lg focus:border-blue-600 focus:outline-none"
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
                            <div className="pt-6">
                                <Button
                                    className="w-full h-12 text-lg bg-blue-700 hover:bg-blue-800"
                                    disabled={!answer}
                                    onClick={handleNext}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function Header() {
    return (
        <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
            <div className="text-2xl font-bold text-slate-900">3Quotes</div>
            <Link href="/">
                <Button variant="ghost" className="text-slate-600">Sign In</Button>
            </Link>
        </header>
    )
}

function ProgressBar({ progress, step }: { progress: number, step: number }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-slate-500">
                <span>Step {step}</span>
            </div>
            <Progress value={Math.min(progress, 95)} className="h-2" />
        </div>
    )
}

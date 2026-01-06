"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, Download, CheckCircle2, ArrowLeft, FileText, Calendar, Wallet, Clock, Mail, Info, ClipboardList, PenTool, RefreshCw, X, MessageSquare, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { refineRFQ, type RFQ } from "@/lib/openai-client";

function EstimateContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const dataString = searchParams.get("data");

    const [rfq, setRfq] = useState<RFQ | null>(null);
    const [generatingPDF, setGeneratingPDF] = useState(false);

    // Feedback State
    const [showRefine, setShowRefine] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [refining, setRefining] = useState(false);

    useEffect(() => {
        if (dataString && !rfq) {
            try {
                setRfq(JSON.parse(decodeURIComponent(dataString)));
            } catch (e) {
                console.error("Failed to parse RFQ data", e);
            }
        }
    }, [dataString, rfq]);

    const handleRefine = async () => {
        if (!feedback.trim() || !rfq) return;

        setRefining(true);
        const apiKey = localStorage.getItem("openai_api_key");
        const model = localStorage.getItem("openai_model") || undefined;

        if (!apiKey) {
            alert("API Key missing. Please configure it in settings.");
            setRefining(false);
            return;
        }

        const response = await refineRFQ(rfq, feedback, apiKey, model);

        if (response.success) {
            setRfq(response.data);
            setShowRefine(false);
            setFeedback("");
            const rfqString = encodeURIComponent(JSON.stringify(response.data));
            router.replace(`/estimate?data=${rfqString}`);
        } else {
            alert("Failed to refine RFQ. Please try again.");
        }
        setRefining(false);
    };

    const generatePDF = () => {
        if (!rfq) return;
        setGeneratingPDF(true);

        try {
            const data = rfq;
            const doc = new jsPDF("p", "mm", "a4");
            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 15;
            const contentWidth = pageWidth - margin * 2;
            let y = 0;

            // Colors
            const darkBg: [number, number, number] = [30, 41, 59]; // slate-800
            const blue: [number, number, number] = [59, 130, 246]; // blue-500
            const green: [number, number, number] = [34, 197, 94]; // green-500
            const orange: [number, number, number] = [249, 115, 22]; // orange-500
            const textDark: [number, number, number] = [15, 23, 42]; // slate-900
            const textMuted: [number, number, number] = [100, 116, 139]; // slate-500
            const bgLight: [number, number, number] = [248, 250, 252]; // slate-50
            const white: [number, number, number] = [255, 255, 255];

            // --- HEADER (Dark background) ---
            doc.setFillColor(...darkBg);
            doc.rect(0, 0, pageWidth, 50, "F");

            // Badge
            doc.setFillColor(59, 130, 246, 0.3);
            doc.roundedRect(margin, 12, 58, 8, 4, 4, "F");
            doc.setFontSize(7);
            doc.setTextColor(...white);
            doc.setFont("helvetica", "bold");
            doc.text("REQUEST FOR QUOTATION", margin + 4, 17.5);

            // Project Title
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text(data.project_title, margin, 34);

            // Meta info row
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(203, 213, 225); // slate-300

            const metaY = 44;
            doc.text(`RFQ: ${data.rfq_number}`, margin, metaY);
            doc.text(`Issued: ${data.date_issued}`, margin + 45, metaY);

            doc.setTextColor(...orange);
            doc.text(`Deadline: ${data.submission_deadline}`, margin + 95, metaY);

            y = 60;

            // --- EXECUTIVE SUMMARY ---
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...blue);
            doc.text("Executive Summary", margin, y);
            y += 6;

            // Summary box
            doc.setFillColor(...bgLight);
            const summaryLines = doc.splitTextToSize(data.executive_summary, contentWidth - 10);
            const summaryHeight = summaryLines.length * 4.5 + 6;
            doc.roundedRect(margin, y, contentWidth, summaryHeight, 3, 3, "F");

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...textDark);
            doc.text(summaryLines, margin + 5, y + 6);
            y += summaryHeight + 8;

            // --- SCOPE OF WORK ---
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...blue);
            doc.text("Scope of Work", margin, y);
            y += 8;

            data.scope_of_work.forEach((item, i) => {
                // Number circle
                doc.setFillColor(219, 234, 254); // blue-100
                doc.circle(margin + 4, y + 2, 4, "F");
                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(...blue);
                doc.text(String(i + 1), margin + 2.5, y + 3.5);

                // Title
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(...textDark);
                doc.text(item.title, margin + 12, y + 3);
                y += 6;

                // Description
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(...textMuted);
                const descLines = doc.splitTextToSize(item.description, contentWidth - 15);
                doc.text(descLines, margin + 12, y);
                y += descLines.length * 4 + 2;

                // Deliverable badge
                doc.setFillColor(220, 252, 231); // green-100
                doc.roundedRect(margin + 12, y - 1, 70, 5, 2, 2, "F");
                doc.setFontSize(7);
                doc.setTextColor(...green);
                doc.text(`Deliverable: ${item.deliverable}`, margin + 14, y + 2);
                y += 8;
            });

            y += 4;

            // --- TWO COLUMN LAYOUT ---
            const col1X = margin;
            const col2X = margin + contentWidth / 2 + 5;
            const colWidth = contentWidth / 2 - 5;
            const startY = y;

            // --- LEFT: Technical Requirements ---
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...blue);
            doc.text("Technical Requirements", col1X, y);
            y += 7;

            data.technical_requirements.forEach((req) => {
                doc.setFillColor(...blue);
                doc.circle(col1X + 2, y, 1, "F");

                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(...textMuted);
                const reqLines = doc.splitTextToSize(req, colWidth - 8);
                doc.text(reqLines, col1X + 6, y + 1);
                y += reqLines.length * 3.5 + 2;
            });

            // --- RIGHT: Info Cards ---
            let rightY = startY;

            // Timeline Card
            doc.setFillColor(...bgLight);
            doc.roundedRect(col2X, rightY, colWidth, 18, 3, 3, "F");
            doc.setFontSize(7);
            doc.setTextColor(...textMuted);
            doc.text("Project Timeline", col2X + 5, rightY + 6);
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...textDark);
            const timelineLines = doc.splitTextToSize(data.project_timeline, colWidth - 10);
            doc.text(timelineLines, col2X + 5, rightY + 12);
            rightY += 22;

            // Budget Card
            doc.setFillColor(...bgLight);
            doc.roundedRect(col2X, rightY, colWidth, 18, 3, 3, "F");
            doc.setFontSize(7);
            doc.setTextColor(...textMuted);
            doc.setFont("helvetica", "normal");
            doc.text("Estimated Budget", col2X + 5, rightY + 6);
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...textDark);
            doc.text(data.budget_range, col2X + 5, rightY + 12);
            rightY += 22;

            // Contact Card
            doc.setFillColor(...bgLight);
            doc.roundedRect(col2X, rightY, colWidth, 18, 3, 3, "F");
            doc.setFontSize(7);
            doc.setTextColor(...textMuted);
            doc.setFont("helvetica", "normal");
            doc.text("Contact for Submission", col2X + 5, rightY + 6);
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...textDark);
            doc.text(data.contact_info, col2X + 5, rightY + 12);

            // --- FOOTER ---
            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...textMuted);
            doc.text("Generated by 3Quotes AI", margin, pageHeight - 10);
            doc.text(new Date().toLocaleDateString(), pageWidth - margin, pageHeight - 10, { align: "right" });

            doc.save(`${data.rfq_number}_RFQ.pdf`);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setGeneratingPDF(false);
        }
    };

    if (!rfq && !dataString) return <div className="p-8 text-center text-slate-500">No RFQ data found.</div>;

    const displayData = rfq || {
        project_title: "Loading...",
        rfq_number: "...",
        date_issued: "...",
        executive_summary: "...",
        scope_of_work: [],
        technical_requirements: [],
        project_timeline: "...",
        budget_range: "...",
        submission_deadline: "...",
        contact_info: "..."
    };

    return (
        <div className="min-h-screen bg-gradient-subtle flex flex-col font-sans">
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
                    <Link href="/settings">
                        <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                            <Settings className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-4xl animate-fade-in relative">

                    {/* Success Banner */}
                    <div className="flex items-center justify-center gap-3 mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                        <div>
                            <span className="font-semibold text-green-800">
                                {rfq ? "RFQ Generated Successfully!" : "Loading RFQ..."}
                            </span>
                        </div>
                    </div>

                    {/* RFQ Card */}
                    <div>
                        <Card className="overflow-hidden shadow-2xl border-0 bg-white">
                            {/* RFQ Header */}
                            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <FileText className="w-32 h-32" />
                                </div>
                                <div className="relative z-10">
                                    <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-wider mb-4">
                                        REQUEST FOR QUOTATION
                                    </span>
                                    <h1 className="text-3xl font-bold mb-2">{displayData.project_title}</h1>
                                    {refining && <span className="text-amber-300 text-sm animate-pulse">Refining your RFQ...</span>}

                                    <div className="flex flex-wrap gap-6 text-slate-300 text-sm mt-4">
                                        <div className="flex items-center gap-2">
                                            <Info className="w-4 h-4" />
                                            <span>{displayData.rfq_number}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>Issued: {displayData.date_issued}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-orange-300">
                                            <Clock className="w-4 h-4" />
                                            <span>Deadline: {displayData.submission_deadline}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RFQ Body */}
                            <div className="p-8 space-y-8">

                                {/* Executive Summary */}
                                <section>
                                    <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <ClipboardList className="w-5 h-5 text-blue-600" />
                                        Executive Summary
                                    </h2>
                                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        {displayData.executive_summary}
                                    </p>
                                </section>

                                <hr className="border-slate-100" />

                                {/* Scope of Work */}
                                <section>
                                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <PenTool className="w-5 h-5 text-blue-600" />
                                        Scope of Work
                                    </h2>
                                    <div className="space-y-4">
                                        {displayData.scope_of_work?.map((item, index) => (
                                            <div key={index} className="flex gap-4">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                                                    <p className="text-slate-600 text-sm mb-2">{item.description}</p>
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Deliverable: {item.deliverable}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <hr className="border-slate-100" />

                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Technical Requirements */}
                                    <section>
                                        <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                            <Settings className="w-5 h-5 text-blue-600" />
                                            Technical Requirements
                                        </h2>
                                        <ul className="space-y-2">
                                            {displayData.technical_requirements?.map((req, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                                                    {req}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>

                                    {/* Timeline & Budget */}
                                    <section className="space-y-4">
                                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                                            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                                                <Calendar className="w-4 h-4" />
                                                Project Timeline
                                            </div>
                                            <div className="font-semibold text-slate-900">{displayData.project_timeline}</div>
                                        </div>
                                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                                            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                                                <Wallet className="w-4 h-4" />
                                                Estimated Budget
                                            </div>
                                            <div className="font-semibold text-slate-900">{displayData.budget_range}</div>
                                        </div>
                                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                                            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                                                <Mail className="w-4 h-4" />
                                                Contact for Submission
                                            </div>
                                            <div className="font-semibold text-slate-900">{displayData.contact_info}</div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Actions - Outside the captured area */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <Button
                            onClick={generatePDF}
                            className="flex-1 h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 btn-shine"
                            disabled={generatingPDF || refining}
                        >
                            {generatingPDF ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5 mr-2" />
                                    Download PDF
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={() => setShowRefine(true)}
                            variant="outline"
                            className="flex-1 h-14 text-base font-semibold rounded-xl border-2 border-slate-200 hover:bg-slate-50"
                            disabled={generatingPDF || refining}
                        >
                            <RefreshCw className={`w-5 h-5 mr-2 ${refining ? "animate-spin" : ""}`} />
                            {refining ? "Refining..." : "Refine / Edit RFQ"}
                        </Button>

                        <Link href="/" className="sm:flex-none">
                            <Button
                                variant="ghost"
                                className="w-full h-14 text-base font-medium text-slate-500 hover:text-slate-900"
                            >
                                Start Over
                            </Button>
                        </Link>
                    </div>

                    {/* Disclaimer */}
                    <p className="text-center text-slate-400 text-sm mt-6 mb-8">
                        This RFQ is AI-generated. Please review content before sharing with vendors.
                    </p>
                </div>
            </div>

            {/* Refine Dialog Overlay */}
            {showRefine && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-scale-up">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Refine RFQ</h3>
                                <p className="text-slate-500 text-sm">Tell the AI what to change or improve.</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowRefine(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                            <div className="flex gap-3">
                                <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <p className="mb-1 font-medium">Example prompts:</p>
                                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                                        <li>"Change the budget to AED 20,000"</li>
                                        <li>"Add 'Post-project support' to the scope"</li>
                                        <li>"Make the requirements strictly eco-friendly"</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Type your feedback here..."
                            className="w-full h-32 p-4 rounded-xl border-2 border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-sans text-slate-900 resize-none mb-4"
                            autoFocus
                        />

                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" onClick={() => setShowRefine(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRefine}
                                disabled={!feedback.trim() || refining}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                            >
                                {refining ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Update RFQ
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EstimatePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
                <div className="animate-pulse text-slate-400">Loading RFQ...</div>
            </div>
        }>
            <EstimateContent />
        </Suspense>
    );
}

"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { QuoteSchema } from "@/lib/openai";
import { z } from "zod";

// We need to redefine schema inference here or import shared type
// For simplicity in this file, we'll assume the structure matches

function EstimateContent() {
    const searchParams = useSearchParams();
    const dataString = searchParams.get("data");

    let quote = null;
    if (dataString) {
        try {
            quote = JSON.parse(decodeURIComponent(dataString));
        } catch (e) {
            console.error("Failed to parse quote data", e);
        }
    }

    // Fallback demo data if no dynamic data (or error)
    const items = quote?.items || [
        { name: "Flooring Installation", qty: "500 sq ft", price: "$5.00", total: "$2,500" },
        { name: "Painting", qty: "3 Rooms", price: "$400", total: "$1,200" },
    ];

    const totalCost = quote?.total_cost || "$3,700";
    const projectName = quote?.project_name || "Home Renovation";
    const clientName = quote?.client_name || "John Doe";
    const date = quote?.date || "Dec 16, 2025";

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
                <Link href="/" className="text-2xl font-bold text-slate-900">3Quotes</Link>
                <Link href="/">
                    <Button variant="ghost" className="text-slate-600">
                        Sign In
                    </Button>
                </Link>
            </header>

            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl px-12 py-10 shadow-xl border-0 bg-white">
                    <div className="flex justify-between items-start mb-8">
                        <div className="text-3xl font-bold text-blue-900">3Quotes</div>
                        <div className="text-xl font-bold text-slate-900">Project Estimate</div>
                    </div>

                    <div className="mb-8">
                        <h3 className="font-bold text-slate-900 mb-4">Summary</h3>
                        <div className="grid grid-cols-3 gap-8 text-sm">
                            <div>
                                <div className="font-bold text-slate-900">Project</div>
                                <div className="text-slate-600 mt-1">{projectName}</div>
                            </div>
                            <div>
                                <div className="font-bold text-slate-900">Client</div>
                                <div className="text-slate-600 mt-1">{clientName}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-slate-900">Date</div>
                                <div className="text-slate-600 mt-1">{date}</div>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden mb-8">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 text-slate-900 font-bold">
                                <tr>
                                    <th className="p-3">Item</th>
                                    <th className="p-3">Qty</th>
                                    <th className="p-3">Unit Price</th>
                                    <th className="p-3">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item: any, index: number) => (
                                    <tr key={index} className="text-slate-700">
                                        <td className="p-3 font-medium">{item.name}</td>
                                        <td className="p-3">{item.qty}</td>
                                        <td className="p-3">{item.price}</td>
                                        <td className="p-3">{item.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end mb-8">
                        <div className="text-right">
                            <span className="font-bold text-slate-900 mr-2">Total Estimated Cost:</span>
                            <span className="font-bold text-slate-900 text-lg">{totalCost}</span>
                        </div>
                    </div>

                    <a href="/sample_quote.pdf" download="3Quotes_Estimate.pdf" className="w-full block">
                        <Button className="w-full h-12 text-md font-semibold bg-blue-700 hover:bg-blue-800">
                            Download PDF
                        </Button>
                    </a>
                </Card>
            </div>
        </div>
    );
}

export default function EstimatePage() {
    return (
        <Suspense fallback={<div>Loading estimate...</div>}>
            <EstimateContent />
        </Suspense>
    )
}

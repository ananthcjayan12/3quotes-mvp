"use client";

import OpenAI from "openai";
import { z } from "zod";

// Schema for the quote line items
export const QuoteItemSchema = z.object({
    name: z.string(),
    qty: z.string(),
    price: z.string(),
    total: z.string(),
});

// Schema for the full quote
export const QuoteSchema = z.object({
    project_name: z.string(),
    client_name: z.string(),
    date: z.string(),
    items: z.array(QuoteItemSchema),
    total_cost: z.string(),
});

// Schema for the follow-up question
export const QuestionSchema = z.object({
    text: z.string(),
    inputType: z.enum(["text", "number", "select"]),
    options: z.array(z.string()).nullable(),
});

// Union Schema
export const NextStepSchema = z.object({
    type: z.enum(["question", "quote"]),
    question: QuestionSchema.nullable(),
    quote: QuoteSchema.nullable(),
});

export type NextStep = z.infer<typeof NextStepSchema>;

export type StepResponse =
    | { success: true; data: NextStep }
    | { success: false; error: "NO_API_KEY" | "API_ERROR" };

const MAX_QUESTIONS = 5;

// Generate a fallback quote
function generateQuote(history: { question: string; answer: string }[], category: string): NextStep {
    const projectName = category.charAt(0).toUpperCase() + category.slice(1) + " Project";

    return {
        type: "quote",
        question: null,
        quote: {
            project_name: projectName,
            client_name: "John Doe",
            date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
            items: [
                { name: "Consultation & Planning", qty: "1", price: "AED 1,800", total: "AED 1,800" },
                { name: "Materials & Equipment", qty: "1", price: "AED 5,500", total: "AED 5,500" },
                { name: "Labor (estimated)", qty: "8 hours", price: "AED 275/hr", total: "AED 2,200" },
                { name: "Project Management", qty: "1", price: "AED 1,500", total: "AED 1,500" },
            ],
            total_cost: "AED 11,000",
        },
    };
}

export async function getNextStep(
    history: { question: string; answer: string }[],
    category: string,
    apiKey?: string
): Promise<StepResponse> {
    // Check for API key
    if (!apiKey) {
        return { success: false, error: "NO_API_KEY" };
    }

    // Force quote generation after max questions
    if (history.length >= MAX_QUESTIONS) {
        return { success: true, data: generateQuote(history, category) };
    }

    const systemPrompt = `
    You are an expert service estimator AI for "3Quotes". 
    Your goal is to gather enough information from the user to provide a realistic, personalized project quote.
    The user has selected the category: "${category}".
    
    Current question count: ${history.length} / ${MAX_QUESTIONS} maximum.
    
    Review the conversation history carefully. 
    - If you have enough information (usually 3-5 key details), generate a Final QUOTE.
    - If we have reached ${MAX_QUESTIONS} questions, you MUST generate a QUOTE.
    - If you need more information, ask a relevant follow-up QUESTION.
    
    Current History:
    ${JSON.stringify(history, null, 2)}
    
    CRITICAL RULES FOR GENERATING QUOTES:
    - ALL PRICES MUST BE IN AED (United Arab Emirates Dirham) currency.
    - The quote MUST be based on the user's specific answers from the conversation history.
    - Extract project details from the user's answers and create LINE ITEMS that match what they described.
    - If user mentioned a budget, ensure total stays within that range.
    - The 'project_name' should reflect what the user actually described, not just the category.
    - Use realistic market prices in AED for the UAE region.
    - Include 3-5 relevant line items based on the conversation.
    
    Rules for Questions:
    - Questions should be concise and relevant to gathering quote details.
    - If asking a question, determine the best input type (text, number, or select).
    - Ask about: scope, budget, timeline, materials, special requirements.
    
    IMPORTANT SCHEMA RULES:
    - Set 'question' to null when type is 'quote'.
    - Set 'quote' to null when type is 'question'.
    - When type is 'question' and inputType is NOT 'select', set options to null.

    Respond with valid JSON matching this schema:
    {
        "type": "question" | "quote",
        "question": { "text": string, "inputType": "text" | "number" | "select", "options": string[] | null } | null,
        "quote": { "project_name": string, "client_name": string, "date": string, "items": [{ "name": string, "qty": string, "price": string, "total": string }], "total_cost": string } | null
    }
    `;

    try {
        const client = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true, // Required for client-side usage
        });

        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "What is the next step?" },
            ],
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) {
            throw new Error("No content from OpenAI");
        }

        const result = NextStepSchema.parse(JSON.parse(content));
        return { success: true, data: result };
    } catch (error) {
        console.error("OpenAI Error:", error);
        return { success: false, error: "API_ERROR" };
    }
}

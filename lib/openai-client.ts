"use client";

import OpenAI from "openai";
import { z } from "zod";

// Available OpenAI models (Latest as of 2025)
export const AVAILABLE_MODELS = [
    // GPT-5 Series (Latest & Best)
    { id: "gpt-5", name: "GPT-5", description: "Latest flagship model - Best overall quality", category: "Recommended" },
    { id: "gpt-5.1", name: "GPT-5.1", description: "Enhanced stability & production-ready", category: "Recommended" },
    { id: "gpt-5-mini", name: "GPT-5 Mini", description: "Fast & cost-efficient GPT-5", category: "Fast" },

    // O-Series (Advanced Reasoning)
    { id: "o3", name: "o3", description: "Best reasoning - Deep analysis & coding", category: "Reasoning" },
    { id: "o3-mini", name: "o3 Mini", description: "Fast reasoning model", category: "Reasoning" },
    { id: "o4-mini", name: "o4-mini", description: "Latest fast reasoning - Great for quotes", category: "Recommended" },

    // GPT-4 Series (Stable & Reliable)
    { id: "gpt-4o", name: "GPT-4o", description: "Omni model - Text & vision capable", category: "Stable" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast & affordable GPT-4o", category: "Fast" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "High quality with faster response", category: "Stable" },
];

export const DEFAULT_MODEL = "o4-mini";

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

// Minimum questions before allowing quote generation
const MIN_QUESTIONS = 5;
// Maximum questions before forcing quote generation
const MAX_QUESTIONS = 10;

// Generate a fallback quote based on history
function generateQuote(history: { question: string; answer: string }[], category: string): NextStep {
    // Extract information from history
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
    apiKey?: string,
    model?: string
): Promise<StepResponse> {
    // Check for API key
    if (!apiKey) {
        return { success: false, error: "NO_API_KEY" };
    }

    // Force quote generation after max questions
    if (history.length >= MAX_QUESTIONS) {
        return { success: true, data: generateQuote(history, category) };
    }

    // Build conversation summary for context
    const conversationSummary = history.map((h, i) =>
        `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`
    ).join("\n\n");

    const systemPrompt = `
You are an expert service estimator AI for "3Quotes" - a professional quotation platform.
Your goal is to gather COMPREHENSIVE information from the user to provide an ACCURATE, PERSONALIZED project quote.

## Context
- Category: "${category}"
- Questions asked so far: ${history.length}
- Minimum questions required: ${MIN_QUESTIONS}
- Maximum questions allowed: ${MAX_QUESTIONS}

## Conversation History
${conversationSummary || "No questions asked yet."}

## CRITICAL INSTRUCTIONS

### When to Generate a QUOTE:
- Only generate a quote after asking AT LEAST ${MIN_QUESTIONS} questions
- You MUST generate a quote after ${MAX_QUESTIONS} questions
- Generate a quote when you have gathered: scope, budget, timeline, specific requirements, and location/size details

### When to Ask a QUESTION:
- If fewer than ${MIN_QUESTIONS} questions have been asked, you MUST ask another question
- Ask targeted questions to understand the project better
- Suggested question topics (in order of importance):
  1. Specific project type/scope within the category
  2. Size/quantity/dimensions
  3. Budget range (provide AED options)
  4. Timeline/urgency
  5. Quality level/materials preference
  6. Location (Dubai, Abu Dhabi, etc.)
  7. Special requirements or preferences
  8. Any existing work to consider
  9. Preferred brands or specifications
  10. Additional services needed

### QUOTE GENERATION RULES (CRITICAL):
1. **ALL PRICES MUST BE IN AED (UAE Dirham)**
2. **The quote MUST directly reflect the user's answers - NO contradictions**
3. **Extract EXACT details from answers:**
   - If user said "3 bedroom villa" → quote must reference 3 bedrooms
   - If user said budget "AED 50,000" → total must be within that budget
   - If user mentioned "marble flooring" → include marble in line items
   - If user said "urgent/2 weeks" → add rush fee if applicable
4. **Project name should describe what user actually wants**, not generic category
5. **Line items should match specific services the user mentioned**
6. **Include 4-6 detailed line items based on conversation**
7. **Use realistic UAE market prices**

### QUESTION FORMAT RULES:
- Use "select" inputType when offering predefined choices (budget ranges, yes/no, material types)
- Use "number" inputType for quantities, sizes, counts
- Use "text" inputType for open-ended descriptions
- Provide 4-6 options when using "select" type
- Options for budget should always be in AED

### JSON SCHEMA RULES:
- Set 'question' to null when type is 'quote'
- Set 'quote' to null when type is 'question'  
- Set 'options' to null when inputType is NOT 'select'

Respond with valid JSON:
{
    "type": "question" | "quote",
    "question": { "text": string, "inputType": "text" | "number" | "select", "options": string[] | null } | null,
    "quote": { "project_name": string, "client_name": string, "date": string, "items": [{ "name": string, "qty": string, "price": string, "total": string }], "total_cost": string } | null
}`;

    try {
        const client = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true,
        });

        const selectedModel = model || DEFAULT_MODEL;

        const completion = await client.chat.completions.create({
            model: selectedModel,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Based on the conversation history, what is the next step? Either ask another relevant question or generate the final quote if you have enough information." },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
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

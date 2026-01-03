import OpenAI from "openai";
import { z } from "zod";

// Lazy initialization to avoid crashing if API key is missing at startup
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY is not set. AI features will use fallback.");
        return null;
    }
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

// Schema for the quote line items
export const QuoteItemSchema = z.object({
    name: z.string().describe("Name of the service or item"),
    qty: z.string().describe("Quantity (e.g., '500 sq ft', '3 Rooms')"),
    price: z.string().describe("Unit price (e.g., '$5.00')"),
    total: z.string().describe("Total price for this item (e.g., '$2,500')"),
});

// Schema for the full quote
export const QuoteSchema = z.object({
    project_name: z.string().describe("Name of the project based on category"),
    client_name: z.string().describe("Client name (use 'John Doe' as default)"),
    date: z.string().describe("Current date"),
    items: z.array(QuoteItemSchema).describe("List of services/items involved"),
    total_cost: z.string().describe("Total estimated cost"),
});

// Schema for the follow-up question
// Note: Using .nullable() instead of .optional() for OpenAI structured outputs compatibility
export const QuestionSchema = z.object({
    text: z.string().describe("The question to ask the user"),
    inputType: z.enum(["text", "number", "select"]).describe("Type of input field to render"),
    options: z.array(z.string()).nullable().describe("Options if inputType is select, null otherwise"),
});

// Union Schema: The model decides to ASK a question OR GIVE a quote.
// Note: Using .nullable() instead of .optional() for OpenAI structured outputs compatibility
export const NextStepSchema = z.object({
    type: z.enum(["question", "quote"]).describe("Whether to ask another question or provide the final quote"),
    question: QuestionSchema.nullable().describe("The question to ask, if type is 'question', otherwise null"),
    quote: QuoteSchema.nullable().describe("The quote to display, if type is 'quote', otherwise null"),
});

export type NextStep = z.infer<typeof NextStepSchema>;

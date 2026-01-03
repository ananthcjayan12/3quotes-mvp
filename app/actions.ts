"use server";

import { getOpenAIClient, NextStepSchema, type NextStep } from "@/lib/openai";
import { zodResponseFormat } from "openai/helpers/zod";

const MAX_QUESTIONS = 10;

// Generate a quote based on collected info
function generateQuote(history: { question: string; answer: string }[], category: string): NextStep {
    const projectName = category.charAt(0).toUpperCase() + category.slice(1) + " Project";

    // Extract budget from history if available
    const budgetAnswer = history.find(h => h.question.toLowerCase().includes("budget"))?.answer || "$5,000 - $10,000";

    return {
        type: "quote",
        question: null,
        quote: {
            project_name: projectName,
            client_name: "John Doe",
            date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
            items: [
                { name: "Consultation & Planning", qty: "1", price: "$500", total: "$500" },
                { name: "Materials & Equipment", qty: "1", price: "$1,500", total: "$1,500" },
                { name: "Labor (estimated)", qty: "8 hours", price: "$75/hr", total: "$600" },
                { name: "Project Management", qty: "1", price: "$400", total: "$400" },
            ],
            total_cost: "$3,000",
        },
    };
}

// Fallback logic when OpenAI API is unavailable
function getFallbackStep(history: { question: string; answer: string }[], category: string): NextStep {
    const questionCount = history.length;

    // Force quote after max questions
    if (questionCount >= MAX_QUESTIONS) {
        return generateQuote(history, category);
    }

    // Simulate a simple Q&A flow
    if (questionCount === 0) {
        return {
            type: "question",
            question: {
                text: `What specific type of ${category} project are you looking for?`,
                inputType: "text",
                options: null,
            },
            quote: null,
        };
    } else if (questionCount === 1) {
        return {
            type: "question",
            question: {
                text: "What is your approximate budget range?",
                inputType: "select",
                options: ["Under $1,000", "$1,000 - $5,000", "$5,000 - $10,000", "Over $10,000"],
            },
            quote: null,
        };
    } else if (questionCount === 2) {
        return {
            type: "question",
            question: {
                text: "What is your preferred timeline?",
                inputType: "select",
                options: ["Urgent (within 1 week)", "Soon (1-2 weeks)", "Flexible (1 month+)"],
            },
            quote: null,
        };
    }

    // Generate quote after 3 questions
    return generateQuote(history, category);
}

export async function getNextStep(history: { question: string; answer: string }[], category: string): Promise<NextStep> {
    const client = getOpenAIClient();

    // Force quote generation after max questions
    if (history.length >= MAX_QUESTIONS) {
        return generateQuote(history, category);
    }

    // If no client (missing API key), use fallback logic
    if (!client) {
        return getFallbackStep(history, category);
    }

    // OpenAI Model: gpt-4o-2024-08-06 (supports structured outputs)
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
    - The quote MUST be based on the user's specific answers from the conversation history.
    - Extract project details from the user's answers and create LINE ITEMS that match what they described.
    - For example, if user said "kitchen remodel with granite countertops", include line items for:
      * Granite Countertop Installation
      * Kitchen Cabinet Work
      * Labor for Kitchen Remodel
    - If user mentioned a budget, ensure total stays within that range.
    - If user mentioned timeline urgency, you may add rush fees if applicable.
    - The 'project_name' should reflect what the user actually described, not just the category.
    - Use realistic market prices for your region.
    - Include 3-5 relevant line items based on the conversation.
    
    Rules for Questions:
    - Questions should be concise and relevant to gathering quote details.
    - If asking a question, determine the best input type (text, number, or select).
    - Ask about: scope, budget, timeline, materials, special requirements.
    
    IMPORTANT SCHEMA RULES:
    - Set 'question' to null when type is 'quote'.
    - Set 'quote' to null when type is 'question'.
    - When type is 'question' and inputType is NOT 'select', set options to null.
  `;

    try {
        // Use standard chat.completions.create with response_format
        // Model: gpt-4o-2024-08-06 (required for structured outputs with Zod)
        const completion = await client.chat.completions.create({
            model: "o4-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "What is the next step?" },
            ],
            response_format: zodResponseFormat(NextStepSchema, "next_step"),
        });

        const content = completion.choices[0].message.content;
        if (!content) {
            throw new Error("No content from OpenAI");
        }

        // Parse and validate the JSON response with Zod
        const result = NextStepSchema.parse(JSON.parse(content));

        return result;
    } catch (error) {
        console.error("OpenAI Error:", error);
        // Fallback in case of error (safety net)
        return getFallbackStep(history, category);
    }
}

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

// Schema for RFQ Scope Items
export const ScopeItemSchema = z.object({
    title: z.string().describe("Title of the scope item"),
    description: z.string().describe("Detailed description of the work required"),
    deliverable: z.string().describe("Expected outcome or deliverable"),
});

// Schema for the full RFQ (Request for Quotation) document
export const RFQSchema = z.object({
    project_title: z.string().describe("Professional title for the project"),
    rfq_number: z.string().describe("Unique RFQ identifier (e.g., RFQ-2025-001)"),
    date_issued: z.string().describe("Current date"),

    // Executive Summary
    executive_summary: z.string().describe("Brief overview of the project and objectives"),

    // Project Scope
    scope_of_work: z.array(ScopeItemSchema).describe("List of specific tasks and deliverables"),

    // Technical/Specific Requirements
    technical_requirements: z.array(z.string()).describe("List of technical specifications, materials, or standards"),

    // Timeline & Budget
    project_timeline: z.string().describe("Expected duration or specific deadlines"),
    budget_range: z.string().describe("Estimated budget range (e.g., 'AED 10,000 - AED 15,000')"),

    // Submission Guidelines
    submission_deadline: z.string().describe("Deadline for vendors to reply (usually 7 days from now)"),
    contact_info: z.string().describe("Contact email or generic placeholder"),
});

// Schema for the follow-up question
export const QuestionSchema = z.object({
    text: z.string(),
    inputType: z.enum(["text", "number", "select"]),
    options: z.array(z.string()).nullable(),
});

// Union Schema
export const NextStepSchema = z.object({
    type: z.enum(["question", "rfq"]),
    question: QuestionSchema.nullable().optional(),
    rfq: RFQSchema.nullable().optional(),
});

export type NextStep = z.infer<typeof NextStepSchema>;
export type RFQ = z.infer<typeof RFQSchema>;

export type StepResponse =
    | { success: true; data: NextStep }
    | { success: false; error: "NO_API_KEY" | "API_ERROR" };

export type RefineResponse =
    | { success: true; data: RFQ }
    | { success: false; error: "NO_API_KEY" | "API_ERROR" };

// Minimum questions before allowing RFQ generation
const MIN_QUESTIONS = 5;
// Default maximum questions (can be overridden via settings)
export const DEFAULT_MAX_QUESTIONS = 10;

// Generate a fallback RFQ based on history
function generateRFQ(history: { question: string; answer: string }[], category: string): NextStep {
    const projectName = category.charAt(0).toUpperCase() + category.slice(1) + " Project";

    return {
        type: "rfq",
        question: null,
        rfq: {
            project_title: `RFQ for ${projectName}`,
            rfq_number: `RFQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            date_issued: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
            executive_summary: `This Request for Quotation (RFQ) outlines the requirements for a ${category} project. The goal is to select a qualified vendor who can deliver high-quality results within the specified timeline and budget.`,
            scope_of_work: [
                {
                    title: "Phase 1: Planning & Design",
                    description: "Initial consultation, site assessment, and detailed planning.",
                    deliverable: "Project plan and design approval."
                },
                {
                    title: "Phase 2: Execution",
                    description: "Implementation of the main project tasks as per specifications.",
                    deliverable: "Completed project work."
                },
                {
                    title: "Phase 3: Review & Handover",
                    description: "Final quality checks and project handover.",
                    deliverable: "Signed off completion certificate."
                }
            ],
            technical_requirements: [
                "All work must comply with local UAE regulations.",
                "Vendor must provide all necessary tools and equipment.",
                "Quality of materials must meet industry standards."
            ],
            project_timeline: "Estimated 2-4 weeks",
            budget_range: "AED 5,000 - AED 15,000",
            submission_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US"),
            contact_info: "procurement@3quotes.ae"
        },
    };
}

export async function getNextStep(
    history: { question: string; answer: string }[],
    category: string,
    apiKey?: string,
    model?: string,
    maxQuestions: number = DEFAULT_MAX_QUESTIONS
): Promise<StepResponse> {
    // Check for API key
    if (!apiKey) {
        return { success: false, error: "NO_API_KEY" };
    }

    // Force RFQ generation after max questions
    if (history.length >= maxQuestions) {
        return { success: true, data: generateRFQ(history, category) };
    }

    // Build conversation summary for context
    const conversationSummary = history.map((h, i) =>
        `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`
    ).join("\n\n");

    const systemPrompt = `
You are an expert Procurement Specialist for "3Quotes".
Your goal is to gather COMPREHENSIVE information from the user to generate a PROFESSIONAL REQUEST FOR QUOTATION (RFQ) document.
This document will be sent to vendors so they can bid on the user's project.

## Context
- Category: "${category}"
- Questions asked so far: ${history.length}
- Minimum questions required: ${MIN_QUESTIONS}
- Maximum questions allowed: ${maxQuestions}

## Conversation History
${conversationSummary || "No questions asked yet."}

## CRITICAL INSTRUCTIONS

### When to Generate an RFQ:
- Only generate the RFQ after asking AT LEAST ${MIN_QUESTIONS} questions.
- You MUST generate the RFQ after ${maxQuestions} questions.
- Generate the RFQ when you have gathered clear details on: scope, tech specs, timeline, location, and budget constraints.

### When to Ask a QUESTION:
- If fewer than ${MIN_QUESTIONS} questions have been asked, you MUST ask another question.
- Ask targeted questions to clarify the "Scope of Work" and "Technical Requirements".
- Examples: 
  - "What specific brands or materials do you prefer?" 
  - "Are there any site access restrictions?"
  - "Do you require post-completion maintenance?"

### RFQ GENERATION RULES (CRITICAL):
1. **Professional Tone:** The output must be a formal business document.
2. **Detailed Scope:** Break down the work into clear, actionable phases or tasks in 'scope_of_work'.
3. **Specific Requirements:** In 'technical_requirements', list specific constraints (e.g., "Must use non-toxic paint", "Work hours 9am-5pm only").
4. **Accurate Reflection:** The RFQ must strictly reflect the user's answers. If they said "low budget", explicitly mention cost-efficiency in requirements.
5. **Budget in AED:** estimated 'budget_range' must be in United Arab Emirates Dirham (AED).

### JSON SCHEMA RULES:
- Set 'question' to null when type is 'rfq'.
- Set 'rfq' to null when type is 'question'.
- When type is 'question', respond with the question object.

Respond with valid JSON:
{
    "type": "question" | "rfq",
    "question": { "text": string, "inputType": "text" | "number" | "select", "options": string[] | null } | null,
    "rfq": {
        "project_title": string,
        "rfq_number": string,
        "date_issued": string,
        "executive_summary": string,
        "scope_of_work": [{ "title": string, "description": string, "deliverable": string }],
        "technical_requirements": string[],
        "project_timeline": string,
        "budget_range": string,
        "submission_deadline": string,
        "contact_info": string
    } | null
}`;

    try {
        const client = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true,
        });

        const selectedModel = model || DEFAULT_MODEL;

        // Reasoning models (o*) do not support temperature
        const isReasoningModel = selectedModel.startsWith("o");
        const params: any = {
            model: selectedModel,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Based on the conversation history, what is the next step? Either ask another relevant question or generate the final RFQ document." },
            ],
            response_format: { type: "json_object" },
        };

        if (!isReasoningModel) {
            params.temperature = 0.7;
        }

        const completion = await client.chat.completions.create(params);

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

export async function refineRFQ(
    currentRFQ: RFQ,
    feedback: string,
    apiKey: string,
    model?: string
): Promise<RefineResponse> {
    if (!apiKey) {
        return { success: false, error: "NO_API_KEY" };
    }

    const systemPrompt = `
You are an expert Procurement Specialist for "3Quotes".
Your goal is to MODIFY an existing Request for Quotation (RFQ) based on user feedback.

## Current RFQ Data
${JSON.stringify(currentRFQ, null, 2)}

## User Feedback (Instructions for Change)
"${feedback}"

## CRITICAL INSTRUCTIONS
1. **Apply Changes:** Carefully interpret the user's feedback and update the specific fields (Scope, Budget, Requirements, etc.) accordingly.
2. **Maintain Professionalism:** Ensure the updated content maintains a formal business tone.
3. **Consistency:** Ensure all related fields are updated. (e.g., if feedback says "add painting", update both scope AND potentially budget/requirements).
4. **Preserve Good Data:** Do not remove existing high-quality details unless specifically asked to change them.
5. **Budget in AED:** Ensure 'budget_range' remains in United Arab Emirates Dirham (AED).

Respond with valid JSON matching the RFQ Schema.
`;

    try {
        const client = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true,
        });

        const selectedModel = model || DEFAULT_MODEL;

        // Reasoning models (o*) do not support temperature
        const isReasoningModel = selectedModel.startsWith("o");
        const params: any = {
            model: selectedModel,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Implement the requested changes and generate the updated RFQ JSON." },
            ],
            response_format: { type: "json_object" },
        };

        if (!isReasoningModel) {
            params.temperature = 0.7;
        }

        const completion = await client.chat.completions.create(params);
        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error("No content from OpenAI");
        }

        const result = RFQSchema.parse(JSON.parse(content));
        return { success: true, data: result };

    } catch (error) {
        console.error("Refine Error:", error);
        return { success: false, error: "API_ERROR" };
    }
}

// Audit Result Schema
export const AuditResultSchema = z.object({
    passed: z.boolean().describe("Whether the RFQ passes audit"),
    issues: z.array(z.string()).describe("List of issues found (empty if passed)"),
    refinement_instructions: z.string().nullable().describe("Instructions for refinement if not passed"),
});

export type AuditResult = z.infer<typeof AuditResultSchema>;

export type AuditResponse =
    | { success: true; data: AuditResult }
    | { success: false; error: "API_ERROR" };

/**
 * Auditor Agent: Validates the generated RFQ against the Q&A history
 * to ensure consistency and completeness.
 */
export async function auditRFQ(
    history: { question: string; answer: string }[],
    rfq: RFQ,
    apiKey: string,
    model?: string
): Promise<AuditResponse> {
    const historyText = history.map((h, i) =>
        `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`
    ).join("\n\n");

    const systemPrompt = `
You are a Quality Assurance Auditor for RFQ (Request for Quotation) documents.
Your job is to compare the generated RFQ against the original Q&A conversation and identify any:

1. **Missing Information**: Details the user provided that are NOT reflected in the RFQ
2. **Contradictions**: RFQ content that contradicts what the user said
3. **Hallucinations**: Information in the RFQ that was never mentioned by the user
4. **Incomplete Scope**: Important aspects that should be added based on the conversation

## Q&A Conversation History
${historyText}

## Generated RFQ
${JSON.stringify(rfq, null, 2)}

## Your Task
Analyze the RFQ against the conversation and determine if it passes quality audit.

### PASS Criteria (ALL must be true):
- All user requirements are reflected in the RFQ
- No contradictions between user answers and RFQ content
- Budget reflects what user stated or is reasonable
- Timeline aligns with user expectations
- Scope of work covers all mentioned tasks

### FAIL Criteria (ANY triggers fail):
- Missing critical requirements from user answers
- Contradicting user's stated preferences
- Adding scope items user didn't request
- Wrong budget range vs what user indicated

Respond with JSON:
{
    "passed": boolean,
    "issues": ["issue 1", "issue 2", ...],  // Empty array if passed
    "refinement_instructions": "Detailed instructions for fixing the issues" | null
}`;

    try {
        const client = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true,
        });

        const selectedModel = model || DEFAULT_MODEL;
        const isReasoningModel = selectedModel.startsWith("o");

        const params: any = {
            model: selectedModel,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Perform the audit and return your assessment." },
            ],
            response_format: { type: "json_object" },
        };

        if (!isReasoningModel) {
            params.temperature = 0.3; // Lower temperature for more consistent auditing
        }

        const completion = await client.chat.completions.create(params);
        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error("No content from OpenAI");
        }

        const result = AuditResultSchema.parse(JSON.parse(content));
        return { success: true, data: result };

    } catch (error) {
        console.error("Audit Error:", error);
        return { success: false, error: "API_ERROR" };
    }
}

/**
 * Generate RFQ with automatic audit and refinement.
 * This is the main function that combines RFQ generation, auditing, and refinement.
 */
export async function generateAuditedRFQ(
    history: { question: string; answer: string }[],
    category: string,
    apiKey: string,
    model?: string,
    maxQuestions: number = DEFAULT_MAX_QUESTIONS
): Promise<RefineResponse> {
    // Step 1: Get raw RFQ from the getNextStep flow (force generation)
    const rawResponse = await forceGenerateRFQ(history, category, apiKey, model);

    if (!rawResponse.success || !rawResponse.data) {
        return { success: false, error: "API_ERROR" };
    }

    const initialRFQ = rawResponse.data;

    // Step 2: Audit the RFQ
    console.log("🔍 Auditing RFQ...");
    const auditResponse = await auditRFQ(history, initialRFQ, apiKey, model);

    if (!auditResponse.success) {
        // If audit fails to run, return the initial RFQ anyway
        console.warn("Audit failed to run, returning unaudited RFQ");
        return { success: true, data: initialRFQ };
    }

    const audit = auditResponse.data;

    // Step 3: If audit passed, return the RFQ
    if (audit.passed) {
        console.log("✅ RFQ passed audit!");
        return { success: true, data: initialRFQ };
    }

    // Step 4: If audit failed, refine the RFQ
    console.log("⚠️ Audit found issues:", audit.issues);
    console.log("🔄 Auto-refining RFQ...");

    const refinementFeedback = `
AUDIT ISSUES FOUND:
${audit.issues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

REFINEMENT INSTRUCTIONS:
${audit.refinement_instructions || "Fix all the issues listed above."}

ORIGINAL Q&A HISTORY FOR REFERENCE:
${history.map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`).join("\n\n")}
`;

    const refinedResponse = await refineRFQ(initialRFQ, refinementFeedback, apiKey, model);

    if (!refinedResponse.success) {
        // If refinement fails, return the initial RFQ
        console.warn("Refinement failed, returning initial RFQ");
        return { success: true, data: initialRFQ };
    }

    console.log("✅ RFQ refined and ready!");
    return { success: true, data: refinedResponse.data };
}

/**
 * Force generate an RFQ (bypasses question count check)
 */
async function forceGenerateRFQ(
    history: { question: string; answer: string }[],
    category: string,
    apiKey: string,
    model?: string
): Promise<{ success: boolean; data: RFQ | null }> {
    const conversationSummary = history.map((h, i) =>
        `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`
    ).join("\n\n");

    const systemPrompt = `
You are an expert Procurement Specialist for "3Quotes".
Generate a PROFESSIONAL REQUEST FOR QUOTATION (RFQ) document based on the conversation below.

## Category: "${category}"

## Conversation History
${conversationSummary}

## CRITICAL RULES:
1. The RFQ MUST accurately reflect ALL information from the conversation
2. Do NOT add scope items that weren't discussed
3. Budget MUST align with what the user indicated
4. All prices in AED (UAE Dirham)
5. Be specific - use exact details from the conversation

Respond with ONLY the RFQ JSON (no "type" wrapper):
{
    "project_title": string,
    "rfq_number": string,
    "date_issued": string,
    "executive_summary": string,
    "scope_of_work": [{ "title": string, "description": string, "deliverable": string }],
    "technical_requirements": string[],
    "project_timeline": string,
    "budget_range": string,
    "submission_deadline": string,
    "contact_info": string
}`;

    try {
        const client = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true,
        });

        const selectedModel = model || DEFAULT_MODEL;
        const isReasoningModel = selectedModel.startsWith("o");

        const params: any = {
            model: selectedModel,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Generate the RFQ document now." },
            ],
            response_format: { type: "json_object" },
        };

        if (!isReasoningModel) {
            params.temperature = 0.5;
        }

        const completion = await client.chat.completions.create(params);
        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error("No content from OpenAI");
        }

        const result = RFQSchema.parse(JSON.parse(content));
        return { success: true, data: result };

    } catch (error) {
        console.error("Force Generate RFQ Error:", error);
        return { success: false, data: null };
    }
}

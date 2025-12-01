/**
 * OpenAI Client Configuration
 */

import OpenAI from 'openai'
import { z } from 'zod'

const PricingRuleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  selector: z.object({
    operator: z.enum(['AND', 'OR']),
    predicates: z.array(z.object({
      type: z.string(),
    }).passthrough())
  }),
  transform: z.object({
    transform: z.object({
      type: z.string(),
      value: z.number().optional(),
      factor: z.number().optional(),
    }),
    constraints: z.object({
      floor: z.number().optional(),
      ceiling: z.number().optional(),
      maxPctDelta: z.number().optional(),
    }).optional()
  }),
  schedule: z.object({
    type: z.literal('immediate')
  }).optional(),
  enabled: z.boolean().optional()
})

const AIResponseSchema = z.object({
  rule: PricingRuleSchema,
  explanation: z.string(),
  confidence: z.number()
})

let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY environment variable is required for AI features'
      )
    }

    openaiClient = new OpenAI({
      apiKey,
    })
  }

  return openaiClient
}

/**
 * Generate SQL from natural language query using GPT-4
 */
export async function generateSQL(
  naturalLanguageQuery: string,
  schema: string
): Promise<{ sql: string; explanation: string }> {
  const client = getOpenAIClient()

  const systemPrompt = `You are a SQL expert. Generate safe, read-only PostgreSQL queries from natural language.

Database Schema:
${schema}

Rules:
- Only generate SELECT queries (no INSERT, UPDATE, DELETE, DROP)
- Use proper quoting for table/column names
- Include LIMIT clauses to prevent large result sets
- Use parameterized placeholders for user inputs
- Explain the query in plain English

Response format (JSON):
{
  "sql": "SELECT ...",
  "explanation": "This query..."
}`

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: naturalLanguageQuery },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    const parsed = JSON.parse(response)
    return {
      sql: parsed.sql,
      explanation: parsed.explanation,
    }
  } catch (error) {
    console.error('[OpenAI] Error generating SQL:', error)
    throw new Error('Failed to generate SQL query')
  }
}

/**
 * Generate a PricingRule JSON object from natural language using GPT-4
 */
export async function generatePricingRule(
  naturalLanguageQuery: string,
  context?: string
): Promise<{ rule: z.infer<typeof PricingRuleSchema>; explanation: string; confidence: number }> {
  const client = getOpenAIClient()

  const systemPrompt = `You are a Pricing Engine expert. Convert natural language requests into a structured PricingRule JSON object.

PricingRule Schema:
{
  "name": "string (descriptive name)",
  "description": "string (optional)",
  "selector": {
    "operator": "AND" | "OR",
    "predicates": [
      { "type": "all" } |
      { "type": "sku", "skuCodes": ["string"] } |
      { "type": "tag", "tags": ["string"] } |
      { "type": "priceRange", "min": number, "max": number, "currency": "string" } |
      { "type": "custom", "field": "string", "operator": "eq"|"ne"|"gt"|"gte"|"lt"|"lte"|"in"|"contains", "value": any }
    ]
  },
  "transform": {
    "transform": 
      { "type": "percentage", "value": number (e.g. 10 for +10%, -5 for -5%) } |
      { "type": "absolute", "value": number (cents) } |
      { "type": "set", "value": number (cents) } |
      { "type": "multiply", "factor": number },
    "constraints": {
      "floor": number (optional),
      "ceiling": number (optional),
      "maxPctDelta": number (optional)
    }
  },
  "schedule": {
    "type": "immediate"
  },
  "enabled": false
}

Rules:
- Interpret the user's intent carefully.
- If they say "increase by 10%", use type: "percentage", value: 10.
- If they say "decrease by $5", use type: "absolute", value: -500 (cents).
- If they mention specific tags or SKUs, add them to selector predicates.
- Always set "enabled" to false.
- Provide a confidence score (0-1) based on how clear the request was.

Response format (JSON):
{
  "rule": { ...PricingRule object... },
  "explanation": "I've created a rule to...",
  "confidence": 0.95
}`

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context: ${context || 'None'}\n\nRequest: ${naturalLanguageQuery}` },
      ],
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    const parsed = JSON.parse(response)

    // Validate with Zod
    const validated = AIResponseSchema.parse(parsed)

    return {
      rule: validated.rule,
      explanation: validated.explanation,
      confidence: validated.confidence,
    }
  } catch (error) {
    console.error('[OpenAI] Error generating PricingRule:', error)
    throw new Error('Failed to generate PricingRule')
  }
}

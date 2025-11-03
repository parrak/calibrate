/**
 * OpenAI Client Configuration
 */

import OpenAI from 'openai'

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

import OpenAI from 'openai'
import type { CaseData } from '../data/mockData'
import { DEMO_CASES } from '../data/mockData'
import { v4 as uuidv4 } from 'uuid'

const client = new OpenAI()

const SYSTEM_PROMPT = `You are a medical billing expert AI. You analyze medical bills, explanations of benefits (EOBs), and insurance documents to identify billing errors, upcoding, duplicate charges, and other issues.

When given medical bill data, respond ONLY with a valid JSON object matching this exact structure (no markdown, no explanation outside the JSON):

{
  "id": "<uuid>",
  "patientName": "<name from bill or 'Unknown Patient'>",
  "status": "active",
  "createdAt": "<ISO 8601 timestamp>",
  "summary": {
    "totalBilled": <number>,
    "insurerPaid": <number>,
    "patientOwes": <number>,
    "potentialSavings": <number>
  },
  "documents": [...],
  "issues": [...],
  "actions": [...],
  "timeline": [
    { "id": "tl-1", "label": "Service Date", "date": "<date>", "completed": true },
    { "id": "tl-2", "label": "Bill Received", "date": "<date>", "completed": true },
    { "id": "tl-3", "label": "EOB Arrived", "date": "", "completed": false },
    { "id": "tl-4", "label": "AI Analysis", "date": "<today>", "completed": true },
    { "id": "tl-5", "label": "Dispute Sent", "date": "", "completed": false },
    { "id": "tl-6", "label": "Appeal Filed", "date": "", "completed": false },
    { "id": "tl-7", "label": "Response Due", "date": "", "completed": false },
    { "id": "tl-8", "label": "Resolved", "date": "", "completed": false }
  ]
}

Issue types: "duplicate", "upcoding", "unbundling", "not_covered", "billing_error", "itemization"
Action types: "dispute_letter", "appeal", "call_script", "itemized_bill", "eob_request"

Focus on finding real, actionable issues. Be specific about CPT codes, amounts, and the legal basis for the dispute.`

export async function analyzeBill(fileDescriptions: string[]): Promise<CaseData> {
  if (!process.env.OPENAI_API_KEY) {
    const demo = { ...DEMO_CASES[0], id: uuidv4(), createdAt: new Date().toISOString() }
    return demo
  }

  const userMessage = fileDescriptions.length > 0
    ? `Please analyze these medical billing documents:\n\n${fileDescriptions.join('\n\n')}`
    : 'Please analyze the provided medical bill and identify any errors, overcharges, or disputable items. Return the demo case structure.'

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    })

    const text = response.choices[0].message.content ?? ''

    const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
    const parsed = JSON.parse(cleaned) as CaseData

    if (!parsed.id) parsed.id = uuidv4()
    if (!parsed.createdAt) parsed.createdAt = new Date().toISOString()

    return parsed
  } catch (err) {
    console.error('OpenAI API error — falling back to demo case:', err)
    const demo = { ...DEMO_CASES[0], id: uuidv4(), createdAt: new Date().toISOString() }
    return demo
  }
}

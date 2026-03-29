const OpenAI = require('openai')

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

async function extractText(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    try {
      const pdfParse = require('pdf-parse')
      const result = await pdfParse(buffer)
      return result.text || ''
    } catch (err) {
      console.warn('PDF parse failed:', err.message)
      return ''
    }
  }
  return ''
}

async function analyzeBill(files) {
  const docs = await Promise.all(
    files.map(async (f) => ({
      ...f,
      text: await extractText(f.buffer, f.mimetype),
    }))
  )

  const docText = docs
    .map((d, i) => `=== Document ${i + 1}: ${d.originalname} ===\n${d.text.slice(0, 4000)}`)
    .join('\n\n')

  if (!docText.trim()) {
    throw new Error('Could not extract text from the uploaded files. Please upload a PDF.')
  }

  const systemPrompt = `You are a medical billing analyst helping patients understand their bills.

Analyze the provided medical bill and/or Explanation of Benefits (EOB) documents.

Return ONLY valid JSON matching this exact schema (no markdown, no extra text):
{
  "eventType": string,
  "dateOfService": string,
  "dueDate": string,
  "daysUntilDue": number,
  "totalBilled": number,
  "insurerPaid": number,
  "patientOwes": number,
  "disputeAmount": number,
  "amountUnderReview": number,
  "amountResolved": number,
  "potentialSavings": number,
  "estimatedOverchargeRisk": number,
  "providerName": string,
  "insurerName": string,
  "providerCount": number,
  "documentsLinked": number,
  "matchConfidence": number,
  "outOfNetworkConcern": boolean,
  "estimateMismatch": boolean,
  "issues": [
    {
      "id": string,
      "severity": "high" | "medium" | "low",
      "title": string,
      "description": string,
      "type": "duplicate" | "mismatch" | "itemization" | "network" | "other",
      "confidence": number,
      "amountAtRisk": number
    }
  ],
  "issueStats": {
    "total": number,
    "high": number,
    "medium": number,
    "low": number,
    "duplicates": number,
    "mismatches": number,
    "itemizationNeeded": number
  },
  "actions": [
    {
      "id": string,
      "title": string,
      "icon": string,
      "type": "letter" | "call" | "dispute",
      "priority": "urgent" | "normal" | "low",
      "whyItMatters": string,
      "draft": string,
      "dueInDays": number
    }
  ],
  "actionStats": {
    "total": number,
    "completed": number,
    "providerContacted": boolean,
    "insurerContacted": boolean,
    "awaitingResponse": boolean,
    "nextFollowUpDate": string
  },
  "timeline": [
    { "id": string, "label": string, "completed": boolean, "date": string }
  ],
  "assignedReviewer": string,
  "caseOwner": string,
  "lastActionTaken": string,
  "tasksPending": number,
  "documentsMissing": number
}

Rules:
- Use 0 for missing numbers, false for missing booleans, empty string for missing strings
- severity must be exactly "high", "medium", or "low"
- matchConfidence is 0-100 (percentage)
- Generate 2-5 issues, 1-3 actions
- Use cautious language, never legal/medical advice
- confidence is 0.0-1.0
- daysUntilDue: estimate based on typical 30-day billing cycles if not found
- potentialSavings: estimate 30-40% of disputeAmount
- estimatedOverchargeRisk: dollar amount potentially overcharged
- Return ONLY the JSON object`

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 3000,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze these medical documents:\n\n${docText}` },
    ],
  })

  const raw = response.choices[0]?.message?.content || '{}'
  const result = JSON.parse(raw)
  const { v4: uuidv4 } = require('uuid')
  result.id = uuidv4()

  // Fill in issueStats if model didn't
  if (!result.issueStats) {
    const issues = result.issues || []
    result.issueStats = {
      total: issues.length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
      duplicates: issues.filter(i => i.type === 'duplicate').length,
      mismatches: issues.filter(i => i.type === 'mismatch').length,
      itemizationNeeded: issues.filter(i => i.type === 'itemization').length,
    }
  }

  if (!result.actionStats) {
    result.actionStats = {
      total: (result.actions || []).length,
      completed: 0,
      providerContacted: false,
      insurerContacted: false,
      awaitingResponse: false,
      nextFollowUpDate: '',
    }
  }

  if (!result.timeline || !Array.isArray(result.timeline)) {
    result.timeline = defaultTimeline()
  }

  return result
}

function defaultTimeline() {
  return [
    { id: 'tl-1', label: 'Bill uploaded',     completed: true,  date: new Date().toLocaleDateString() },
    { id: 'tl-2', label: 'Text extracted',    completed: true,  date: new Date().toLocaleDateString() },
    { id: 'tl-3', label: 'Issues flagged',    completed: true,  date: new Date().toLocaleDateString() },
    { id: 'tl-4', label: 'Actions generated', completed: true,  date: new Date().toLocaleDateString() },
    { id: 'tl-5', label: 'Provider contacted',completed: false, date: '' },
    { id: 'tl-6', label: 'Insurer contacted', completed: false, date: '' },
    { id: 'tl-7', label: 'Awaiting reply',    completed: false, date: '' },
    { id: 'tl-8', label: 'Resolved',          completed: false, date: '' },
  ]
}

module.exports = { analyzeBill }

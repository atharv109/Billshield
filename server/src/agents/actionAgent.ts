import type { Flag, ActionOutput } from '../types/agentTypes'
import { routedCall, hasAnyLLMProvider } from '../routing/router'

const SYSTEM = `You are a patient advocate assistant. Given one medical billing review flag, generate exactly one clear, calm, professional next step the patient can take — either a call script or an email draft.

Rules:
- Output exactly one action
- Reference the specific issue from the flag
- Calm and professional tone
- Easy for a non-expert to use immediately
- No legal or medical advice
- Use placeholders like [YOUR NAME], [ACCOUNT NUMBER], [DATE OF SERVICE] where patient details are needed

Output schema (JSON only):
{
  "action_type": "call_script|email_draft",
  "contact_target": "provider|insurer",
  "reason_for_action": string,
  "content": string,
  "confidence": number
}`

/**
 * Safe template fallback — used when all LLM providers fail.
 * Produces exactly one usable action based on the top flag's contact_target.
 * Confidence 0.5 reflects that the action is structurally correct but not
 * tailored to the specific flag wording.
 */
function generateTemplateAction(topFlag: Flag): ActionOutput {
  if (topFlag.contact_target === 'insurer') {
    return {
      action_type: 'call_script',
      contact_target: 'insurer',
      reason_for_action: topFlag.title,
      content: `When calling your insurance company (number on the back of your insurance card):

Opening:
"Hello, I am calling about a claim for services on [DATE OF SERVICE]. My name is [YOUR NAME] and my member ID is [MEMBER ID]. I have a question about my Explanation of Benefits."

Ask about: ${topFlag.title}

Key questions:
1. "Can you explain how this charge was processed?"
2. "Is there anything I should review or confirm with my provider?"
3. "What is the deadline to request a review if needed?"

Keep a record of: the representative's name, date, and reference number for this call.`,
      confidence: 0.5,
    }
  }

  return {
    action_type: 'email_draft',
    contact_target: 'provider',
    reason_for_action: topFlag.title,
    content: `Subject: Question Regarding My Bill — Account [ACCOUNT NUMBER]

Dear Billing Department,

I am writing regarding my bill for services on [DATE OF SERVICE] (Account #[ACCOUNT NUMBER]).

I am reviewing my bill and have a question about the following: ${topFlag.title}

${topFlag.explanation}

Could you please review this item and provide clarification? I would appreciate a written response within 30 days.

Thank you for your assistance.

Sincerely,
[YOUR NAME]
[YOUR PHONE NUMBER]`,
    confidence: 0.5,
  }
}

export async function actionAgent(
  topFlag: Flag,
  providerName: string | null,
  insurerName: string | null,
): Promise<ActionOutput> {
  // ── No LLM configured — return template ──────────────────────────────────
  if (!hasAnyLLMProvider('actionAgent'))
    return generateTemplateAction(topFlag)

  try {
    const input = {
      top_flag: {
        flag_type: topFlag.flag_type,
        title: topFlag.title,
        explanation: topFlag.explanation,
        why_it_matters: topFlag.why_it_matters,
        contact_target: topFlag.contact_target,
        severity: topFlag.severity,
      },
      provider_name: providerName,
      insurer_name: insurerName,
    }

    // ── Route: cheap/free primary (MiroFish) → Gemini → paid fallback (Anthropic)
    const { result, meta } = await routedCall<ActionOutput>(
      'actionAgent',
      SYSTEM,
      `Generate one next step action for this billing review flag:\n\n${JSON.stringify(input, null, 2)}`,
      512,
    )

    const template = generateTemplateAction(topFlag)

    return {
      action_type: (
        ['call_script', 'email_draft'].includes(result.action_type)
          ? result.action_type
          : template.action_type
      ) as ActionOutput['action_type'],
      contact_target: (
        ['provider', 'insurer'].includes(result.contact_target)
          ? result.contact_target
          : topFlag.contact_target
      ) as ActionOutput['contact_target'],
      reason_for_action:
        typeof result.reason_for_action === 'string'
          ? result.reason_for_action
          : topFlag.title,
      content:
        typeof result.content === 'string' && result.content.length > 50
          ? result.content
          : template.content,
      // Apply routing confidence penalty.
      // actionAgent primary (MiroFish) carries a 0.9 penalty in config to reflect
      // that cheap model wording may need review.
      confidence:
        (typeof result.confidence === 'number' ? result.confidence : 0.7) *
        meta.confidencePenalty,
    }
  } catch {
    // All providers failed — return safe template action
    return generateTemplateAction(topFlag)
  }
}

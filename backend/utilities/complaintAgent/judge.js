/**
 * judge.js — Judge Agent for the Complaint Case-Builder.
 *
 * Evaluates the Investigator's case file and produces:
 * - confidence_score (0.0 - 1.0)
 * - judge_satisfied (boolean)
 * - routing_decision (auto_respond | needs_human_review)
 * - Detailed reasoning for both confidence and satisfaction
 */

import { chatCompletionJSON } from '../openrouterLlm.js';

const JUDGE_MODEL = 'nvidia/nemotron-3-super-120b-a12b';
const JUDGE_TEMPERATURE = 0.2;
const CONFIDENCE_THRESHOLD = 0.85;

const SYSTEM_PROMPT = `You are a quality assessor for Sanjhi AI's complaint investigation system.
Your role is to evaluate the quality of case files produced by the Investigator Agent and decide whether they are reliable enough for automatic response or require human review.

EVALUATION CRITERIA:

1. EVIDENCE COMPLETENESS (0.0 - 1.0):
   - Are all claims in the complaint backed by database records?
   - Is there missing data that would affect the conclusion?
   - Are both parties' records examined?

2. CONTRADICTION CLARITY (0.0 - 1.0):
   - Are identified contradictions specific and unambiguous?
   - Do they cite exact timestamps, amounts, or record IDs?
   - Are there any unresolved ambiguities?

3. TIMELINE CONSISTENCY (0.0 - 1.0):
   - Do payment timestamps align with claimed dates?
   - Are due dates vs submission dates clearly compared?
   - Is the timeline analysis logical and complete?

4. RECOMMENDATION APPROPRIATENESS:
   - Does the recommended action match the severity of findings?
   - Is the reasoning sound and well-supported by evidence?
   - Are there any logical leaps or unsupported conclusions?

CONFIDENCE SCORING:
- 0.90 - 1.00: Very high confidence — evidence is complete, contradictions are clear, recommendation is sound
- 0.85 - 0.89: High confidence — minor gaps but overall reliable
- 0.70 - 0.84: Moderate confidence — some ambiguities or missing data
- 0.50 - 0.69: Low confidence — significant gaps or unclear evidence
- Below 0.50: Very low confidence — investigation is unreliable

JUDGE SATISFACTION:
Even if confidence is high (>= 0.85), you may mark judge_satisfied = false if:
- The recommended action seems too lenient or too harsh given the evidence
- There are ethical concerns not addressed
- The investigation missed a critical angle
- You have specific concerns that should be flagged for human review

ROUTING DECISION:
- IF confidence >= 0.85 AND judge_satisfied = true → "auto_respond"
- IF confidence >= 0.85 AND judge_satisfied = false → "needs_human_review"
- IF confidence < 0.85 → "needs_human_review"

OUTPUT FORMAT (JSON):
{
  "confidence_score": 0.87,
  "judge_satisfied": true,
  "routing_decision": "auto_respond",
  "confidence_reasoning": "Detailed explanation of why this confidence score was assigned",
  "satisfaction_reasoning": "Explanation of satisfaction decision (or concerns if not satisfied)",
  "evidence_completeness": 0.95,
  "contradiction_clarity": 0.90,
  "timeline_consistency": 0.85,
  "recommendation_appropriateness": 0.88,
  "concerns": ["List any specific concerns for human reviewer"]
}`;

/**
 * Run the Judge Agent on a case file.
 * @param {object} caseFile - structured case file from Investigator
 * @returns {Promise<object>} judge assessment with confidence and routing
 */
export async function judge(caseFile) {
  const startTime = Date.now();

  // Build case file summary for Judge
  const caseSummary = `
CASE FILE TO EVALUATE:

Summary: ${caseFile.case_summary}

Evidence Trail (${caseFile.evidence_trail?.length || 0} items):
${(caseFile.evidence_trail || []).map((e, i) => `  ${i + 1}. [${e.type}] ${e.description} — Relevance: ${e.relevance}`).join('\n') || '  No evidence provided'}

Contradictions (${caseFile.contradictions?.length || 0}):
${(caseFile.contradictions || []).map((c, i) => `  ${i + 1}. ${c}`).join('\n') || '  No contradictions identified'}

Timeline Analysis:
- Claimed: ${caseFile.timeline_analysis?.claimed_by_complainant || 'N/A'}
- Actual: ${caseFile.timeline_analysis?.actual_timeline || 'N/A'}
- Discrepancy: ${caseFile.timeline_analysis?.discrepancy || 'N/A'}

Recommendation:
- Priority: ${caseFile.recommended_priority || 'N/A'}
- Action: ${caseFile.recommended_action || 'N/A'}
- Reasoning: ${caseFile.reasoning || 'N/A'}
`;

  // Call LLM to evaluate case file
  const assessment = await chatCompletionJSON(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Evaluate this case file and provide your assessment:\n\n${caseSummary}` },
    ],
    {
      model: JUDGE_MODEL,
      temperature: JUDGE_TEMPERATURE,
      top_p: 0.9,
      max_tokens: 2048,
      timeoutMs: 45000,
    }
  );

  // Validate output schema
  const requiredFields = ['confidence_score', 'judge_satisfied', 'routing_decision', 'confidence_reasoning', 'satisfaction_reasoning'];
  for (const field of requiredFields) {
    if (assessment[field] === undefined) {
      throw new Error(`Judge output missing required field: ${field}`);
    }
  }

  // Validate confidence score is a number between 0 and 1
  if (typeof assessment.confidence_score !== 'number' || assessment.confidence_score < 0 || assessment.confidence_score > 1) {
    throw new Error(`Judge confidence_score must be a number between 0 and 1, got: ${assessment.confidence_score}`);
  }

  // Validate routing decision matches confidence and satisfaction
  const expectedRouting =
    assessment.confidence_score >= CONFIDENCE_THRESHOLD && assessment.judge_satisfied
      ? 'auto_respond'
      : 'needs_human_review';

  if (assessment.routing_decision !== expectedRouting) {
    console.warn(`Judge routing decision mismatch: got ${assessment.routing_decision}, expected ${expectedRouting}. Correcting.`);
    assessment.routing_decision = expectedRouting;
  }

  // Add metadata
  assessment.judge_metadata = {
    judge_model: JUDGE_MODEL,
    confidence_threshold: CONFIDENCE_THRESHOLD,
    judged_at: new Date().toISOString(),
    judgment_duration_ms: Date.now() - startTime,
  };

  return assessment;
}

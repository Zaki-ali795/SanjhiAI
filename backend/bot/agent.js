import Groq from 'groq-sdk';
import { TOOL_DEFINITIONS, executeTool } from './tools/index.js';
import { updateSession } from './sessionManager.js';
import { detectLanguage } from './formatter.js';

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const MAX_TURNS = 3;

const SYSTEM_PROMPT = `You are Sanjhi Bot — a bilingual WhatsApp assistant for Sanjhi, Pakistan's trusted peer-to-peer committee savings platform.

LANGUAGE:
- Detect language from each user message (English, Roman Urdu, or Urdu script)
- Always reply in the SAME language the user used
- Keep replies SHORT and conversational — this is WhatsApp, not a web page
- Use *bold* for names and amounts, _italic_ for hints
- Max 3 emojis per reply

PERSONALITY: Friendly, trustworthy, concise. Always confirm before creating or joining anything. Ask for missing info naturally.

BLOCKED ACTIONS — if user asks for any of these, politely refuse and say to use the web app at sanjhi.pk:
- Marking someone else's payment as paid
- Changing profile (name, photo, email, notification settings)
- Any admin actions
- Releasing payouts

TOOL USE: Call the right tool. If required info is missing, ask for it. After tool result, reply in natural language — do NOT return raw JSON.`;

export async function runAgent(phone, userText, session) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { reply: 'Bot is not configured (missing GROQ_API_KEY).', sessionExpired: false };

  const groq = new Groq({ apiKey });
  const detectedLang = detectLanguage(userText);

  const history = session.conversationHistory || [];
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userText },
  ];

  let sessionExpired = false;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      tools: TOOL_DEFINITIONS,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const choice = completion.choices[0];
    const assistantMsg = choice.message;

    if (choice.finish_reason === 'tool_calls' && assistantMsg.tool_calls?.length > 0) {
      messages.push(assistantMsg);

      for (const toolCall of assistantMsg.tool_calls) {
        const fnName = toolCall.function.name;
        let args = {};
        try {
          args = JSON.parse(toolCall.function.arguments || '{}');
        } catch { /* empty args */ }

        const result = await executeTool(fnName, args, session, phone);

        if (result.error === 'SESSION_EXPIRED') {
          sessionExpired = true;
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: 'Session expired. User needs to re-login.' }),
          });
          break;
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result.success ? result.data : { error: result.error }),
        });
      }

      if (sessionExpired) break;
      continue;
    }

    const reply = assistantMsg.content || '...';

    const updatedHistory = [...history, { role: 'user', content: userText }, { role: 'assistant', content: reply }];
    const trimmedHistory = updatedHistory.slice(-12);

    await updateSession(phone, {
      conversationHistory: trimmedHistory,
      detectedLang,
    });

    return { reply, sessionExpired };
  }

  if (sessionExpired) {
    return { reply: null, sessionExpired: true };
  }

  return { reply: '⚠️ Something went wrong. Please try again.', sessionExpired: false };
}

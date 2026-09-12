const URDU_UNICODE_RE = /[\u0600-\u06FF]/;
const ROMAN_URDU_KEYWORDS = /\b(meri|mera|mere|karo|kia|kya|dikhao|batao|btao|haan|ha|nahi|nahi|aur|committee|kamiti|kameti|paisa|paise|dena|lena|kab|kahan|kese|kaisa|shukriya|mehrbani|bhai|yaar)\b/i;

export function detectLanguage(text) {
  if (!text) return 'en';
  if (URDU_UNICODE_RE.test(text)) return 'ur';
  if (ROMAN_URDU_KEYWORDS.test(text)) return 'ur-roman';
  return 'en';
}

export function truncateReply(text, maxWords = 200) {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

export function formatAmount(n) {
  const num = Number(n);
  if (isNaN(num)) return 'Rs. 0';
  return `Rs. ${num.toLocaleString('en-PK')}`;
}

export function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Country codes with SVG flag data URIs, dial codes, and phone formats.
 */
export const COUNTRIES = [
  { code: 'PK', name: 'Pakistan',       dial: '+92',  flag: flagPK(),  maxLength: 10, pattern: /^3\d{9}$/,       placeholder: '3XX XXXXXXX' },
  { code: 'IN', name: 'India',          dial: '+91',  flag: flagIN(),  maxLength: 10, pattern: /^[6-9]\d{9}$/,    placeholder: 'XXXXX XXXXX' },
  { code: 'US', name: 'United States',  dial: '+1',   flag: flagUS(),  maxLength: 10, pattern: /^[2-9]\d{9}$/,    placeholder: '(XXX) XXX-XXXX' },
  { code: 'GB', name: 'United Kingdom', dial: '+44',  flag: flagGB(),  maxLength: 10, pattern: /^7\d{9}$/,        placeholder: '7XXX XXXXXX' },
  { code: 'AE', name: 'UAE',            dial: '+971', flag: flagAE(),  maxLength: 9,  pattern: /^5\d{8}$/,        placeholder: '5X XXX XXXX' },
  { code: 'SA', name: 'Saudi Arabia',   dial: '+966', flag: flagSA(),  maxLength: 9,  pattern: /^5\d{8}$/,        placeholder: '5X XXX XXXX' },
  { code: 'CA', name: 'Canada',         dial: '+1',   flag: flagCA(),  maxLength: 10, pattern: /^[2-9]\d{9}$/,    placeholder: '(XXX) XXX-XXXX' },
  { code: 'AU', name: 'Australia',      dial: '+61',  flag: flagAU(),  maxLength: 9,  pattern: /^4\d{8}$/,        placeholder: '4XX XXX XXX' },
  { code: 'DE', name: 'Germany',        dial: '+49',  flag: flagDE(),  maxLength: 11, pattern: /^1[5-7]\d{8,9}$/, placeholder: '1XX XXXXXXXX' },
  { code: 'FR', name: 'France',         dial: '+33',  flag: flagFR(),  maxLength: 9,  pattern: /^[67]\d{8}$/,     placeholder: 'X XX XX XX XX' },
  { code: 'TR', name: 'Turkey',         dial: '+90',  flag: flagTR(),  maxLength: 10, pattern: /^5\d{9}$/,        placeholder: '5XX XXX XXXX' },
  { code: 'MY', name: 'Malaysia',       dial: '+60',  flag: flagMY(),  maxLength: 9,  pattern: /^1\d{8,9}$/,      placeholder: '1X-XXX XXXX' },
  { code: 'BD', name: 'Bangladesh',     dial: '+880', flag: flagBD(),  maxLength: 10, pattern: /^1\d{9}$/,        placeholder: '1XXX-XXXXXX' },
  { code: 'AF', name: 'Afghanistan',    dial: '+93',  flag: flagAF(),  maxLength: 9,  pattern: /^7\d{8}$/,        placeholder: '7XX XXX XXX' },
  { code: 'QA', name: 'Qatar',          dial: '+974', flag: flagQA(),  maxLength: 8,  pattern: /^[357]\d{7}$/,    placeholder: 'XXXX XXXX' },
  { code: 'KW', name: 'Kuwait',         dial: '+965', flag: flagKW(),  maxLength: 8,  pattern: /^[569]\d{7}$/,    placeholder: 'XXXX XXXX' },
  { code: 'OM', name: 'Oman',           dial: '+968', flag: flagOM(),  maxLength: 8,  pattern: /^9\d{7}$/,        placeholder: '9XXX XXXX' },
  { code: 'SG', name: 'Singapore',      dial: '+65',  flag: flagSG(),  maxLength: 8,  pattern: /^[89]\d{7}$/,     placeholder: 'XXXX XXXX' },
];

export function validatePhone(digits, country) {
  if (!digits) return { valid: false, message: '' };
  if (digits.length < country.maxLength) return { valid: false, message: `${country.maxLength - digits.length} more digit${country.maxLength - digits.length > 1 ? 's' : ''} needed` };
  if (digits.length > country.maxLength) return { valid: false, message: 'Too many digits' };
  if (!country.pattern.test(digits)) return { valid: false, message: `Invalid ${country.name} number` };
  return { valid: true, message: 'Valid number' };
}

export const DEFAULT_COUNTRY = COUNTRIES[0];

/* ── SVG Flag helpers (data URIs) ── */
function svgFlag(colors, extra = '') {
  const w = 48, h = 32;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" rx="4" fill="#eee"/>${colors}${extra}</svg>`)}`;
}

function flagPK() { return svgFlag('<rect width="12" height="32" fill="#fff"/>', '<rect x="12" width="36" height="32" fill="#01411C"/><circle cx="31" cy="14" r="6" fill="#fff"/><circle cx="33" cy="13" r="5.5" fill="#01411C"/><polygon points="28,18 29.2,14.5 26,16.7 30,16.7 26.8,14.5" fill="#fff"/>'); }
function flagIN() { return svgFlag('<rect width="48" height="10.67" fill="#FF9933"/><rect y="10.67" width="48" height="10.67" fill="#fff"/><rect y="21.33" width="48" height="10.67" fill="#138808"/>', '<circle cx="24" cy="16" r="3.5" fill="none" stroke="#000080" stroke-width="0.6"/>'); }
function flagUS() { return svgFlag('<rect width="48" height="32" fill="#B22234"/>', '<rect y="4.92" width="48" height="2.46" fill="#fff"/><rect y="9.85" width="48" height="2.46" fill="#fff"/><rect y="14.77" width="48" height="2.46" fill="#fff"/><rect y="19.69" width="48" height="2.46" fill="#fff"/><rect y="24.62" width="48" height="2.46" fill="#fff"/><rect y="29.54" width="48" height="2.46" fill="#fff"/><rect width="19.2" height="17.23" fill="#3C3B6E"/>'); }
function flagGB() { return svgFlag('<rect width="48" height="32" fill="#012169"/>', '<path d="M0,0 L48,32 M48,0 L0,32" stroke="#fff" stroke-width="5.3"/><path d="M0,0 L48,32 M48,0 L0,32" stroke="#C8102E" stroke-width="3.5"/><path d="M24,0 V32 M0,16 H48" stroke="#fff" stroke-width="8"/><path d="M24,0 V32 M0,16 H48" stroke="#C8102E" stroke-width="4.8"/>'); }
function flagAE() { return svgFlag('<rect width="48" height="10.67" fill="#00732F"/><rect y="10.67" width="48" height="10.67" fill="#fff"/><rect y="21.33" width="48" height="10.67" fill="#000"/>', '<rect width="12" height="32" fill="#FF0000"/>'); }
function flagSA() { return svgFlag('<rect width="48" height="32" fill="#006C35"/>', '<text x="24" y="20" text-anchor="middle" fill="#fff" font-size="8" font-family="serif">&#x0644;&#x0627;</text>'); }
function flagCA() { return svgFlag('<rect width="12" height="32" fill="#FF0000"/><rect x="12" width="24" height="32" fill="#fff"/><rect x="36" width="12" height="32" fill="#FF0000"/>', '<path d="M24,8 l2,5 l5,0 l-4,3 l1.5,5 l-4.5,-3 l-4.5,3 l1.5,-5 l-4,-3 l5,0z" fill="#FF0000"/>'); }
function flagAU() { return svgFlag('<rect width="48" height="32" fill="#00008B"/>', '<rect width="24" height="16" fill="#00008B"/><path d="M0,0 L24,16 M24,0 L0,16" stroke="#fff" stroke-width="2"/><path d="M12,0 V16 M0,8 H24" stroke="#fff" stroke-width="3.3"/><path d="M12,0 V16 M0,8 H24" stroke="#C8102E" stroke-width="2"/>'); }
function flagDE() { return svgFlag('<rect width="48" height="10.67" fill="#000"/><rect y="10.67" width="48" height="10.67" fill="#DD0000"/><rect y="21.33" width="48" height="10.67" fill="#FFCC00"/>'); }
function flagFR() { return svgFlag('<rect width="16" height="32" fill="#002395"/><rect x="16" width="16" height="32" fill="#fff"/><rect x="32" width="16" height="32" fill="#ED2939"/>'); }
function flagTR() { return svgFlag('<rect width="48" height="32" fill="#E30A17"/>', '<circle cx="21" cy="16" r="6" fill="#fff"/><circle cx="23.5" cy="16" r="4.8" fill="#E30A17"/><polygon points="30,16 27,18 28.2,14.8 26.2,16.8 29.5,14.5" fill="#fff"/>'); }
function flagMY() { return svgFlag('<rect width="48" height="32" fill="#fff"/>', '<rect y="2.29" width="48" height="2.29" fill="#CC0001"/><rect y="6.86" width="48" height="2.29" fill="#CC0001"/><rect y="11.43" width="48" height="2.29" fill="#CC0001"/><rect y="16" width="48" height="2.29" fill="#CC0001"/><rect y="20.57" width="48" height="2.29" fill="#CC0001"/><rect y="25.14" width="48" height="2.29" fill="#CC0001"/><rect y="29.71" width="48" height="2.29" fill="#CC0001"/><rect width="24" height="18.29" fill="#010066"/>'); }
function flagBD() { return svgFlag('<rect width="48" height="32" fill="#006A4E"/>', '<circle cx="22" cy="16" r="9" fill="#F42A41"/>'); }
function flagAF() { return svgFlag('<rect width="16" height="32" fill="#000"/><rect x="16" width="16" height="32" fill="#BE0000"/><rect x="32" width="16" height="32" fill="#007A36"/>', '<circle cx="24" cy="16" r="4" fill="#fff" opacity="0.5"/>'); }
function flagQA() { return svgFlag('<rect width="48" height="32" fill="#8D1B3D"/>', '<rect width="12" height="32" fill="#fff"/><polygon points="12,0 16,2.67 12,5.33 16,8 12,10.67 16,13.33 12,16 16,18.67 12,21.33 16,24 12,26.67 16,29.33 12,32 12,0" fill="#8D1B3D"/>'); }
function flagKW() { return svgFlag('<rect width="48" height="10.67" fill="#007A3D"/><rect y="10.67" width="48" height="10.67" fill="#fff"/><rect y="21.33" width="48" height="10.67" fill="#CE1126"/>', '<polygon points="0,0 12,10.67 12,21.33 0,32" fill="#000"/>'); }
function flagOM() { return svgFlag('<rect width="48" height="32" fill="#fff"/>', '<rect width="12" height="32" fill="#C8102E"/><rect y="16" x="12" width="36" height="16" fill="#008000"/><rect x="12" width="36" height="16" fill="#fff"/>'); }
function flagSG() { return svgFlag('<rect width="48" height="16" fill="#ED2939"/><rect y="16" width="48" height="16" fill="#fff"/>', '<circle cx="14" cy="11" r="4" fill="#fff"/><circle cx="15.8" cy="11" r="3.5" fill="#ED2939"/>'); }

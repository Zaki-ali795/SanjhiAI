/**
 * calendarGenerator.js — Generates 1-click Google Calendar URLs and .ics (iCal) content.
 */

/**
 * Format a Date or ISO string into UTC string format required by Google Calendar & iCal (YYYYMMDDTHHmmssZ).
 * @param {Date | string} dateInput
 * @returns {string}
 */
function toCalendarUtcString(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generate 1-click Google Calendar Web URL.
 * @param {{ title: string, description: string, startDate: Date|string, endDate?: Date|string, location?: string }} params
 * @returns {string}
 */
export function generateGoogleCalendarUrl({ title, description, startDate, endDate, location = 'Sanjhi AI Platform' }) {
  const start = toCalendarUtcString(startDate);
  const end = endDate ? toCalendarUtcString(endDate) : toCalendarUtcString(new Date(new Date(startDate).getTime() + 3600000)); // default 1 hr

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    location,
    dates: `${start}/${end}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate standard iCal (.ics) file string content for Apple Calendar & Outlook.
 * @param {{ title: string, description: string, startDate: Date|string, endDate?: Date|string, location?: string, uid?: string }} params
 * @returns {string}
 */
export function generateIcsContent({ title, description, startDate, endDate, location = 'Sanjhi AI Platform', uid }) {
  const start = toCalendarUtcString(startDate);
  const end = endDate ? toCalendarUtcString(endDate) : toCalendarUtcString(new Date(new Date(startDate).getTime() + 3600000));
  const eventUid = uid || `sanjhi-payment-${Date.now()}@sanjhi.pk`;
  const nowStr = toCalendarUtcString(new Date());

  const cleanTitle = title.replace(/\n/g, ' ');
  const cleanDesc = description.replace(/\n/g, '\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sanjhi AI//ROSCA Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${eventUid}`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT1D', // 1 day before reminder
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${cleanTitle}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * calendarHelper.js — Frontend utility for 1-click Google Calendar links & .ics file downloads.
 */

function toCalendarUtcString(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generate 1-click Google Calendar URL.
 */
export function getGoogleCalendarUrl({ title, description, startDate, endDate, location = 'Sanjhi AI Platform' }) {
  const start = toCalendarUtcString(startDate);
  const end = endDate ? toCalendarUtcString(endDate) : toCalendarUtcString(new Date(new Date(startDate).getTime() + 3600000));

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
 * Trigger .ics file download in the browser.
 */
export function downloadIcsFile({ title, description, startDate, endDate, location = 'Sanjhi AI Platform', filename = 'sanjhi-payment-reminder.ics' }) {
  const start = toCalendarUtcString(startDate);
  const end = endDate ? toCalendarUtcString(endDate) : toCalendarUtcString(new Date(new Date(startDate).getTime() + 3600000));
  const uid = `sanjhi-${Date.now()}@sanjhi.pk`;
  const nowStr = toCalendarUtcString(new Date());

  const cleanTitle = title.replace(/\n/g, ' ');
  const cleanDesc = description.replace(/\n/g, '\\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sanjhi AI//ROSCA Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${cleanTitle}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

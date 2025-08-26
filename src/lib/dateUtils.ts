// src/lib/dateUtils.ts

export function formatTodoDate(
  startTimeStr: string,
  endTimeStr: string
): string {
  const startDate = new Date(startTimeStr);
  const endDate = new Date(endTimeStr);

  // Options-Objekt für die Anzeige MIT Uhrzeit
  const fullOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  // Options-Objekt für die Anzeige OHNE Uhrzeit
  const dateOnlyOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  // 1. Prüfen, ob es ein ganztägiges Event ist
  if (startTimeStr.length <= 10) {
    return `${startDate.toLocaleDateString(
      "de-DE",
      dateOnlyOptions
    )} (Ganztägig)`;
  }

  // 2. Prüfen, ob Start- und Endzeit exakt identisch sind
  if (startDate.getTime() === endDate.getTime()) {
    // NEU: Gib nur das Datum mit den 'dateOnlyOptions' zurück
    return startDate.toLocaleDateString("de-DE", dateOnlyOptions);
  }

  // 3. Wenn sie am selben Tag, aber zu unterschiedlichen Zeiten sind
  if (startDate.toDateString() === endDate.toDateString()) {
    const formattedStartDate = startDate.toLocaleString("de-DE", fullOptions);
    const timeOnlyOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    };
    const formattedEndTime = endDate.toLocaleTimeString(
      "de-DE",
      timeOnlyOptions
    );
    return `${formattedStartDate} - ${formattedEndTime} Uhr`;
  }

  // 4. Wenn sie sich an unterschiedlichen Tagen befinden
  const formattedStartDate = startDate.toLocaleString("de-DE", fullOptions);
  const formattedEndDate = endDate.toLocaleString("de-DE", fullOptions);
  return `${formattedStartDate} Uhr - ${formattedEndDate} Uhr`;
}

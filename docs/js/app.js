document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  const popup = document.getElementById("event-popup");
  const popupTitle = document.getElementById("popupTitle");
  const popupDate = document.getElementById("popupDate");
  const popupTime = document.getElementById("popupTime");
  const popupNote = document.getElementById("popupNote");
  const popupClose = document.querySelector(".popup-close");
  const popupOverlay = document.querySelector(".popup-overlay");

  function normalizeTime(timeString) {
    if (!timeString) return undefined;
    const colonMatch = timeString.match(/^(\d{1,2}):(\d{1,2})$/);
    const japaneseMatch = timeString.match(/^(\d{1,2})\s*時(?:\s*(\d{1,2})\s*分?)?$/);
    const digitsMatch = timeString.match(/^(\d{1,2})\s*$/);

    let hours;
    let minutes;

    if (colonMatch) {
      hours = Number(colonMatch[1]);
      minutes = Number(colonMatch[2]);
    } else if (japaneseMatch) {
      hours = Number(japaneseMatch[1]);
      minutes = japaneseMatch[2] ? Number(japaneseMatch[2]) : 0;
    } else if (digitsMatch) {
      hours = Number(digitsMatch[1]);
      minutes = 0;
    } else {
      return timeString;
    }

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return timeString;
    }

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function formatPopupDate(date) {
    if (!date) return "";
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "short"
    }).format(date);
  }

  function formatTime(date) {
    if (!date) return "";
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function openPopup() {
    popup.classList.remove("hidden");
    popup.setAttribute("aria-hidden", "false");
  }

  function closePopup() {
    if (popup.dataset.eventId) {
      saveNote(popup.dataset.eventId, popupNote.value);
    }
    popup.classList.add("hidden");
    popup.setAttribute("aria-hidden", "true");
  }

  function getStorageKey(eventId) {
    return `lessons-calendar-note:${eventId}`;
  }

  function loadNote(eventId) {
    return localStorage.getItem(getStorageKey(eventId)) || "";
  }

  function saveNote(eventId, note) {
    localStorage.setItem(getStorageKey(eventId), note);
  }

  function showEventPopup(info) {
    const original = info.event.extendedProps.originalEvent || {};
    const dateText = info.event.start ? formatPopupDate(info.event.start) : "";
    const startText = original.start ? normalizeTime(original.start) : formatTime(info.event.start);
    const endText = original.end ? normalizeTime(original.end) : formatTime(info.event.end);
    const timeText = info.event.allDay ? "終日" : `${startText} - ${endText}`;
    const eventId = info.event.id || `${original.title}|${original.date}|${original.start || ""}|${original.end || ""}`;

    popupTitle.textContent = info.event.title;
    popupDate.textContent = `日付: ${dateText}`;
    popupTime.textContent = `時間: ${timeText}`;
    popupNote.value = loadNote(eventId);
    popup.dataset.eventId = eventId;
    openPopup();
  }

  popupClose.addEventListener("click", closePopup);
  popupOverlay.addEventListener("click", closePopup);

  fetch("data/events.json")
    .then(response => response.json())
    .then(events => {
      const calendarEvents = events.map(event => {
        const category = event.title.includes("空手")
          ? "karate"
          : event.title.includes("NEiS")
          ? "neis"
          : event.title.includes("ダンス")
          ? "dance"
          : "other";

        const eventId = `${event.title}|${event.date}|${event.start || ""}|${event.end || ""}`;
        const baseEvent = {
          id: eventId,
          title: event.title,
          classNames: [`category-${category}`],
          extendedProps: {
            originalEvent: event
          }
        };

        if (event.start && event.end) {
          const normalizedStart = normalizeTime(event.start);
          const normalizedEnd = normalizeTime(event.end);

          return {
            ...baseEvent,
            start: `${event.date}T${normalizedStart}`,
            end: `${event.date}T${normalizedEnd}`
          };
        }

        return {
          ...baseEvent,
          start: event.date,
          allDay: true
        };
      });

      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: "ja",
        firstDay: 0,
        dayMaxEventRows: false,
        events: calendarEvents,
        eventClick(info) {
          info.jsEvent.preventDefault();
          showEventPopup(info);
        }
      });

      calendar.render();
    });
});

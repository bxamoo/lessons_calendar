document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  const popup = document.getElementById("event-popup");
  const popupTitle = document.getElementById("popupTitle");
  const popupDate = document.getElementById("popupDate");
  const popupTime = document.getElementById("popupTime");
  const popupClose = document.querySelector(".popup-close");
  const popupOverlay = document.querySelector(".popup-overlay");
  const popupOk = document.querySelector(".popup-ok");
  const popupCancel = document.querySelector(".popup-cancel");
  let currentEventId = "";

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
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(date);
    return `${month}/${day} (${weekday})`;
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
    popup.classList.add("hidden");
    popup.setAttribute("aria-hidden", "true");
  }

  function showEventPopup(info) {
    const original = info.event.extendedProps.originalEvent || {};
    const dateText = info.event.start ? formatPopupDate(info.event.start) : "";
    const startText = original.start ? normalizeTime(original.start) : formatTime(info.event.start);
    const endText = original.end ? normalizeTime(original.end) : formatTime(info.event.end);
    const timeText = info.event.allDay ? "終日" : `${startText} - ${endText}`;
    currentEventId = info.event.id || `${original.title}|${original.date}|${original.start || ""}|${original.end || ""}`;

    popupTitle.textContent = info.event.title;
    popupDate.textContent = `日付: ${dateText}`;
    popupTime.textContent = `時間: ${timeText}`;
    openPopup();
  }

  popupClose.addEventListener("click", () => closePopup());
  popupCancel.addEventListener("click", () => closePopup());
  popupOk.addEventListener("click", () => closePopup());
  popupOverlay.addEventListener("click", () => closePopup());

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
        dayCellContent(info) {
          return { html: String(info.date.getDate()) };
        },
        eventContent(info) {
          const container = document.createElement("div");
          container.className = "event-content-wrapper";

          const dot = document.createElement("span");
          dot.className = "event-dot";
          info.event.classNames.forEach(name => dot.classList.add(name));

          const timeLabel = document.createElement("span");
          timeLabel.className = "event-time";
          if (!info.event.allDay && info.event.start) {
            timeLabel.textContent = `${formatTime(info.event.start)}-${formatTime(info.event.end)}`;
          } else {
            timeLabel.textContent = "";
          }

          const title = document.createElement("span");
          title.className = "event-title";
          title.textContent = info.event.title;

          container.appendChild(dot);
          if (timeLabel.textContent) {
            container.appendChild(timeLabel);
          }
          container.appendChild(title);

          return { domNodes: [container] };
        },
        eventClick(info) {
          info.jsEvent.preventDefault();
          showEventPopup(info);
        }
      });

      calendar.render();
    });
});

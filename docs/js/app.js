document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

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

        const baseEvent = {
          title: event.title,
          classNames: [`category-${category}`]
        };

        if (event.start && event.end) {
          return {
            ...baseEvent,
            start: `${event.date}T${event.start}`,
            end: `${event.date}T${event.end}`
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
        events: calendarEvents
      });

      calendar.render();
    });
});

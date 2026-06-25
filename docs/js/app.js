document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

  fetch("data/events.json")
    .then(response => response.json())
    .then(events => {
      const calendarEvents = events.map(event => {
        if (event.start && event.end) {
          return {
            title: event.title,
            start: `${event.date}T${event.start}`,
            end: `${event.date}T${event.end}`
          };
        }

        return {
          title: event.title,
          start: event.date,
          allDay: true
        };
      });

      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: "ja",
        firstDay: 0,
        events: calendarEvents
      });

      calendar.render();
    });
});

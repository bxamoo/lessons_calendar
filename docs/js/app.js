document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

  fetch("data/events.json")
    .then(response => response.json())
    .then(events => {
      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: "ja",
        firstDay: 0,
        events: events
      });

      calendar.render();
    });
});

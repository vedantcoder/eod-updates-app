export function getWeekStartDate(weeksOffset = 0) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + (weeksOffset * 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getWeekEndDate(startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  return endDate;
}

export function toDateKey(date) {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

export function getWeekLabel(weeksOffset = 0) {
  const weekStart = getWeekStartDate(weeksOffset);
  const options = { month: "short", day: "numeric" };
  return `Week of ${weekStart.toLocaleDateString("en-US", options)}`;
}

export function getRecentWeekTabs(count = 8) {
  const pastWeeks = Array.from({ length: count }, (_, index) => -(count - 1 - index));
  const futureWeeks = [1, 2];
  const orderedOffsets = [...pastWeeks, ...futureWeeks];

  return orderedOffsets.map((offset) => {
    const weekStart = getWeekStartDate(offset);
    const weekEnd = getWeekEndDate(weekStart);
    const options = { month: "short", day: "numeric" };
    return {
      offset,
      label: getWeekLabel(offset),
      dateLabel: `${weekStart.toLocaleDateString("en-US", options)} - ${weekEnd.toLocaleDateString("en-US", options)}`,
      disabled: offset > 0,
    };
  });
}

export function groupLogsByDate(logs = []) {
  return logs.reduce((acc, log) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log);
    return acc;
  }, {});
}

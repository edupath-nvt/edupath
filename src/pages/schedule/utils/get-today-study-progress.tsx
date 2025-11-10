export function getTodayStudyProgress(startDay: Dayjs, duration: number, now: Dayjs): number {
  if (now.isBefore(startDay)) {
    return 0;
  }

  const endDay = startDay.add(duration, 'hour');

  if (now.isSameOrAfter(endDay)) {
    return 100;
  }

  const minutesStudied = now.diff(startDay, 'minute');
  const minutesTotal = duration * 60;

  const percent = (minutesStudied / minutesTotal) * 100;
  return Math.min(100, Math.round(percent * 10) / 10);
}

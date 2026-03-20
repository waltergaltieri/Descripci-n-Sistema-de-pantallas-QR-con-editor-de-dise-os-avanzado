const dayOrder = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const normalizeDays = (daysOfWeek) =>
  String(daysOfWeek || '')
    .split(',')
    .map((day) => day.trim().toLowerCase())
    .filter(Boolean);

const toMinutes = (timeValue) => {
  if (!timeValue) {
    return null;
  }

  const [hours, minutes] = String(timeValue).split(':').map((value) => Number.parseInt(value, 10));

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

const expandTimeRange = (startTime, endTime) => {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  if (startMinutes === null || endMinutes === null) {
    return [];
  }

  if (startMinutes < endMinutes) {
    return [[startMinutes, endMinutes]];
  }

  return [
    [startMinutes, 1440],
    [0, endMinutes]
  ];
};

const timeRangesOverlap = (leftRule, rightRule) => {
  const leftRanges = expandTimeRange(leftRule.start_time, leftRule.end_time);
  const rightRanges = expandTimeRange(rightRule.start_time, rightRule.end_time);

  return leftRanges.some(([leftStart, leftEnd]) =>
    rightRanges.some(([rightStart, rightEnd]) => leftStart < rightEnd && rightStart < leftEnd)
  );
};

const daysOverlap = (leftRule, rightRule) => {
  const leftDays = new Set(normalizeDays(leftRule.days_of_week));
  const rightDays = normalizeDays(rightRule.days_of_week);

  return rightDays.some((day) => leftDays.has(day));
};

const normalizeDateBoundary = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.getTime();
};

const dateRangesOverlap = (leftRule, rightRule) => {
  const leftStart = normalizeDateBoundary(leftRule.starts_on, Number.NEGATIVE_INFINITY);
  const leftEnd = normalizeDateBoundary(leftRule.ends_on, Number.POSITIVE_INFINITY);
  const rightStart = normalizeDateBoundary(rightRule.starts_on, Number.NEGATIVE_INFINITY);
  const rightEnd = normalizeDateBoundary(rightRule.ends_on, Number.POSITIVE_INFINITY);

  return leftStart <= rightEnd && rightStart <= leftEnd;
};

const getLocalDateKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const ruleMatchesDateTime = (rule, date) => {
  if (!rule || rule.is_active === 0) {
    return false;
  }

  const currentDay = dayOrder[date.getDay()];
  const allowedDays = normalizeDays(rule.days_of_week);

  if (!allowedDays.includes(currentDay)) {
    return false;
  }

  const currentDateKey = getLocalDateKey(date);

  if (rule.starts_on && currentDateKey < rule.starts_on) {
    return false;
  }

  if (rule.ends_on && currentDateKey > rule.ends_on) {
    return false;
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  return expandTimeRange(rule.start_time, rule.end_time).some(
    ([startMinutes, endMinutes]) => currentMinutes >= startMinutes && currentMinutes < endMinutes
  );
};

const findScheduleConflicts = (candidateRule, existingRules = [], options = {}) => {
  const ignoreId = options.ignoreId || null;

  return existingRules.filter((existingRule) => {
    if (!existingRule || existingRule.is_active === 0) {
      return false;
    }

    if (ignoreId !== null && Number(existingRule.id) === Number(ignoreId)) {
      return false;
    }

    return (
      daysOverlap(candidateRule, existingRule) &&
      dateRangesOverlap(candidateRule, existingRule) &&
      timeRangesOverlap(candidateRule, existingRule)
    );
  });
};

const hasScheduleConflicts = (rules = []) =>
  rules.some((rule, index) => {
    const siblingRules = rules.filter((_, siblingIndex) => siblingIndex !== index);
    return findScheduleConflicts(rule, siblingRules).length > 0;
  });

module.exports = {
  dayOrder,
  expandTimeRange,
  findScheduleConflicts,
  hasScheduleConflicts,
  normalizeDays,
  ruleMatchesDateTime,
  timeRangesOverlap
};

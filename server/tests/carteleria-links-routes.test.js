const test = require('node:test');
const assert = require('node:assert/strict');

const { hasScheduleConflicts } = require('../utils/scheduleValidator');

test('overlapping rules on same weekday are rejected', () => {
  const hasConflict = hasScheduleConflicts([
    { days_of_week: 'mon', start_time: '06:00', end_time: '08:00' },
    { days_of_week: 'mon', start_time: '07:30', end_time: '09:00' }
  ]);

  assert.equal(hasConflict, true);
});

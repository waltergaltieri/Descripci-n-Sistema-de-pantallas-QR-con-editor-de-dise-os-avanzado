const test = require('node:test');
const assert = require('node:assert/strict');

const { getProductVisibility } = require('../utils/carteleriaStatus');
const { resolveMenuForLink } = require('../utils/menuResolver');
const { findScheduleConflicts } = require('../utils/scheduleValidator');

test('manual override wins over schedule and default menu', () => {
  const resolved = resolveMenuForLink(
    {
      status: 'active',
      default_menu_id: 1,
      manual_menu_id: 2,
      manual_override_active: 1,
      rules: [
        {
          menu_id: 3,
          days_of_week: 'mon,tue,wed,thu,fri',
          start_time: '06:00',
          end_time: '11:00',
          is_active: 1
        }
      ]
    },
    new Date('2026-03-20T09:00:00-03:00')
  );

  assert.equal(resolved.menuId, 2);
  assert.equal(resolved.source, 'manual_override');
});

test('matching schedule rule wins over default menu', () => {
  const resolved = resolveMenuForLink(
    {
      status: 'active',
      default_menu_id: 10,
      manual_override_active: 0,
      rules: [
        {
          id: 1,
          menu_id: 11,
          days_of_week: 'fri,sat',
          start_time: '08:00',
          end_time: '12:00',
          is_active: 1
        }
      ]
    },
    new Date('2026-03-20T09:30:00-03:00')
  );

  assert.equal(resolved.menuId, 11);
  assert.equal(resolved.source, 'schedule_rule');
  assert.equal(resolved.ruleId, 1);
});

test('paused link resolves as unavailable', () => {
  const resolved = resolveMenuForLink(
    {
      status: 'paused',
      default_menu_id: 5,
      manual_override_active: 0,
      rules: []
    },
    new Date('2026-03-20T09:30:00-03:00')
  );

  assert.equal(resolved.menuId, null);
  assert.equal(resolved.source, 'paused_link');
});

test('schedule validator detects overlapping rules on same days', () => {
  const conflicts = findScheduleConflicts(
    {
      days_of_week: 'mon,tue,wed,thu,fri',
      start_time: '07:30',
      end_time: '10:00',
      starts_on: '2026-03-01',
      ends_on: '2026-03-31'
    },
    [
      {
        id: 99,
        days_of_week: 'fri,sat',
        start_time: '06:00',
        end_time: '08:00',
        starts_on: '2026-03-01',
        ends_on: '2026-03-31'
      }
    ]
  );

  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].id, 99);
});

test('schedule validator ignores non-overlapping rules', () => {
  const conflicts = findScheduleConflicts(
    {
      days_of_week: 'sun',
      start_time: '07:30',
      end_time: '10:00'
    },
    [
      {
        id: 100,
        days_of_week: 'mon,tue',
        start_time: '07:30',
        end_time: '10:00'
      }
    ]
  );

  assert.equal(conflicts.length, 0);
});

test('paused products are hidden and sold out products stay visible', () => {
  assert.deepEqual(getProductVisibility('paused'), {
    visible: false,
    showSoldOutBadge: false
  });

  assert.deepEqual(getProductVisibility('sold_out'), {
    visible: true,
    showSoldOutBadge: true
  });
});

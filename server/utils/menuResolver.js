const { ruleMatchesDateTime } = require('./scheduleValidator');

const sortRulesByPriority = (rules = []) =>
  [...rules].sort((leftRule, rightRule) => {
    const leftPriority = Number(leftRule.priority || 0);
    const rightPriority = Number(rightRule.priority || 0);

    if (leftPriority !== rightPriority) {
      return rightPriority - leftPriority;
    }

    const leftStart = String(leftRule.start_time || '');
    const rightStart = String(rightRule.start_time || '');

    if (leftStart !== rightStart) {
      return leftStart.localeCompare(rightStart);
    }

    return Number(leftRule.id || 0) - Number(rightRule.id || 0);
  });

const resolveMenuForLink = (link, currentDate = new Date()) => {
  if (!link || link.status === 'paused') {
    return {
      menuId: null,
      source: 'paused_link',
      ruleId: null
    };
  }

  if (link.manual_override_active && link.manual_menu_id) {
    return {
      menuId: link.manual_menu_id,
      source: 'manual_override',
      ruleId: null
    };
  }

  const matchingRule = sortRulesByPriority(link.rules || []).find((rule) =>
    ruleMatchesDateTime(rule, currentDate)
  );

  if (matchingRule) {
    return {
      menuId: matchingRule.menu_id,
      source: 'schedule_rule',
      ruleId: matchingRule.id || null
    };
  }

  if (link.default_menu_id) {
    return {
      menuId: link.default_menu_id,
      source: 'default_menu',
      ruleId: null
    };
  }

  return {
    menuId: null,
    source: 'no_menu',
    ruleId: null
  };
};

module.exports = {
  resolveMenuForLink
};

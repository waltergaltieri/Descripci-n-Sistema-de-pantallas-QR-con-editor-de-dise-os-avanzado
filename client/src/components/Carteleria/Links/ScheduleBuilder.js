import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const weekDays = [
  { key: 'mon', label: 'Lun' },
  { key: 'tue', label: 'Mar' },
  { key: 'wed', label: 'Mie' },
  { key: 'thu', label: 'Jue' },
  { key: 'fri', label: 'Vie' },
  { key: 'sat', label: 'Sab' },
  { key: 'sun', label: 'Dom' }
];

const createRule = (menus) => ({
  id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  rule_name: '',
  menu_id: menus[0]?.id ? String(menus[0].id) : '',
  days_of_week: 'mon,tue,wed,thu,fri',
  start_time: '06:00',
  end_time: '08:00',
  starts_on: '',
  ends_on: '',
  priority: 0,
  is_active: true
});

const toggleDay = (daysOfWeek, dayKey) => {
  const currentDays = String(daysOfWeek || '')
    .split(',')
    .map((day) => day.trim())
    .filter(Boolean);

  const nextDays = currentDays.includes(dayKey)
    ? currentDays.filter((day) => day !== dayKey)
    : [...currentDays, dayKey];

  return nextDays.join(',');
};

const ScheduleBuilder = ({ menus, rules, onChange }) => {
  const handleRuleChange = (ruleId, field, value) => {
    onChange(
      rules.map((rule) => (rule.id === ruleId ? { ...rule, [field]: value } : rule))
    );
  };

  const handleDayToggle = (ruleId, dayKey) => {
    onChange(
      rules.map((rule) =>
        rule.id === ruleId
          ? { ...rule, days_of_week: toggleDay(rule.days_of_week, dayKey) }
          : rule
      )
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-gray-900">Programacion horaria</h4>
          <p className="mt-1 text-sm text-gray-500">
            Define que menu se muestra segun dia, franja y prioridad.
          </p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => onChange([...rules, createRule(menus)])}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar regla
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
          Todavia no hay reglas. Si no agregas ninguna, el link usa el menu por defecto.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {rules.map((rule) => {
            const selectedDays = String(rule.days_of_week || '').split(',').filter(Boolean);

            return (
              <div key={rule.id} className="rounded-2xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-4">
                    <div>
                      <label htmlFor={`rule-name-${rule.id}`} className="label">
                        Nombre de regla
                      </label>
                      <input
                        id={`rule-name-${rule.id}`}
                        type="text"
                        className="input"
                        value={rule.rule_name || ''}
                        onChange={(event) => handleRuleChange(rule.id, 'rule_name', event.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor={`rule-menu-${rule.id}`} className="label">
                        Menu de la regla
                      </label>
                      <select
                        id={`rule-menu-${rule.id}`}
                        className="input"
                        value={rule.menu_id || ''}
                        onChange={(event) => handleRuleChange(rule.id, 'menu_id', event.target.value)}
                      >
                        <option value="">Sin menu</option>
                        {menus.map((menu) => (
                          <option key={menu.id} value={menu.id}>
                            {menu.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor={`rule-start-time-${rule.id}`} className="label">
                        Hora inicio
                      </label>
                      <input
                        id={`rule-start-time-${rule.id}`}
                        type="time"
                        className="input"
                        value={rule.start_time || ''}
                        onChange={(event) => handleRuleChange(rule.id, 'start_time', event.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor={`rule-end-time-${rule.id}`} className="label">
                        Hora fin
                      </label>
                      <input
                        id={`rule-end-time-${rule.id}`}
                        type="time"
                        className="input"
                        value={rule.end_time || ''}
                        onChange={(event) => handleRuleChange(rule.id, 'end_time', event.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="rounded-xl border border-red-200 p-2 text-red-600"
                    onClick={() => onChange(rules.filter((currentRule) => currentRule.id !== rule.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label htmlFor={`rule-start-date-${rule.id}`} className="label">
                        Fecha desde
                      </label>
                      <input
                        id={`rule-start-date-${rule.id}`}
                        type="date"
                        className="input"
                        value={rule.starts_on || ''}
                        onChange={(event) => handleRuleChange(rule.id, 'starts_on', event.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor={`rule-end-date-${rule.id}`} className="label">
                        Fecha hasta
                      </label>
                      <input
                        id={`rule-end-date-${rule.id}`}
                        type="date"
                        className="input"
                        value={rule.ends_on || ''}
                        onChange={(event) => handleRuleChange(rule.id, 'ends_on', event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="label">Dias</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day.key}
                        type="button"
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                          selectedDays.includes(day.key)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                        onClick={() => handleDayToggle(rule.id, day.key)}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScheduleBuilder;

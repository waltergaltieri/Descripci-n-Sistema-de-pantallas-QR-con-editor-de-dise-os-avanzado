import React from 'react';

const HEX_COLOR_PATTERN = /^#([0-9a-f]{6})$/i;

const resolvePickerValue = (value, fallback) =>
  HEX_COLOR_PATTERN.test(String(value || '')) ? value : fallback;

const ColorInputField = ({
  disabled = false,
  fallback = '#111827',
  id,
  label,
  onChange,
  pickerAriaLabel,
  placeholder = '#111827',
  textAriaLabel,
  value
}) => (
  <div>
    <label htmlFor={id} className="label">
      {label}
    </label>

    <div className="flex items-center gap-3">
      <input
        aria-label={pickerAriaLabel}
        type="color"
        className="h-11 w-14 cursor-pointer rounded-xl border border-gray-200 bg-white p-1"
        value={resolvePickerValue(value, fallback)}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />

      <input
        id={id}
        aria-label={textAriaLabel || label}
        type="text"
        className="input flex-1"
        value={value || ''}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </div>
  </div>
);

export default ColorInputField;

export const ARGENTINA_NUMBER_HINT = 'Formato AR sugerido: 1.234,56';

const removeInvalidCharacters = (value = '') => String(value).replace(/[^\d,.-]/g, '');
const isDigitsOnly = (value = '') => /^\d+$/.test(value);
const looksLikeGroupedInteger = (value = '') => {
  const parts = String(value).split('.');

  if (parts.length <= 1) {
    return false;
  }

  const [firstPart, ...remainingParts] = parts;

  if (!isDigitsOnly(firstPart) || firstPart.length < 1 || firstPart.length > 3) {
    return false;
  }

  return remainingParts.every((part, index) => {
    if (!isDigitsOnly(part)) {
      return false;
    }

    if (index === remainingParts.length - 1) {
      return part.length >= 3;
    }

    return part.length === 3;
  });
};

export const normalizeLocalizedNumberInput = (value = '') => {
  const sanitizedValue = removeInvalidCharacters(value).trim();

  if (!sanitizedValue) {
    return '';
  }

  const hasComma = sanitizedValue.includes(',');
  const dotMatches = sanitizedValue.match(/\./g) || [];
  const hasDot = dotMatches.length > 0;

  if (hasComma && hasDot) {
    const lastCommaIndex = sanitizedValue.lastIndexOf(',');
    const lastDotIndex = sanitizedValue.lastIndexOf('.');
    const decimalSeparatorIndex = Math.max(lastCommaIndex, lastDotIndex);
    const integerPart = sanitizedValue.slice(0, decimalSeparatorIndex).replace(/[.,]/g, '');
    const decimalPart = sanitizedValue.slice(decimalSeparatorIndex + 1).replace(/[^\d]/g, '');

    return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  }

  if (hasComma) {
    const parts = sanitizedValue.split(',');
    const decimalPart = parts.pop().replace(/[^\d]/g, '');
    const integerPart = parts.join('').replace(/[^\d-]/g, '');

    return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  }

  if (dotMatches.length > 1) {
    const parts = sanitizedValue.split('.');
    const decimalPart = parts.pop().replace(/[^\d]/g, '');
    const integerPart = parts.join('').replace(/[^\d-]/g, '');

    return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  }

  if (hasDot) {
    if (looksLikeGroupedInteger(sanitizedValue)) {
      return sanitizedValue.replace(/\./g, '');
    }

    const [integerPart = '', decimalPart = ''] = sanitizedValue.split('.');
    if (decimalPart.length === 3) {
      return `${integerPart}${decimalPart}`;
    }
  }

  return sanitizedValue;
};

export const parseLocalizedNumberInput = (value = '') => {
  const normalizedValue = normalizeLocalizedNumberInput(value);

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

export const formatArgentinaNumberInput = (value = '', options = {}) => {
  const sanitizedValue = removeInvalidCharacters(value).trim();
  const maxDecimals = options.maxDecimals ?? 2;

  if (!sanitizedValue) {
    return '';
  }

  const isNegative = sanitizedValue.startsWith('-');
  const unsignedValue = sanitizedValue.replace(/-/g, '');
  const separatorMatches = [...unsignedValue.matchAll(/[.,]/g)];
  let integerDigits = unsignedValue.replace(/[^\d]/g, '');
  let decimalDigits = '';
  let keepDecimalSeparator = false;

  if (separatorMatches.length > 0) {
    const lastSeparatorIndex = separatorMatches[separatorMatches.length - 1].index ?? -1;
    const decimalCandidate = unsignedValue.slice(lastSeparatorIndex + 1).replace(/[^\d]/g, '');
    const hasComma = unsignedValue.includes(',');
    const shouldTreatAsThousandsOnly =
      !hasComma &&
      unsignedValue[lastSeparatorIndex] === '.' &&
      looksLikeGroupedInteger(unsignedValue);

    if (!shouldTreatAsThousandsOnly) {
      integerDigits = unsignedValue.slice(0, lastSeparatorIndex).replace(/[^\d]/g, '');
      decimalDigits = decimalCandidate.slice(0, maxDecimals);
      keepDecimalSeparator = /[.,]$/.test(unsignedValue);
    }
  }

  if (!integerDigits && decimalDigits) {
    integerDigits = '0';
  }

  if (!integerDigits) {
    return isNegative ? '-' : '';
  }

  const formattedInteger = new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0
  }).format(Number(integerDigits));

  const signedValue = `${isNegative ? '-' : ''}${formattedInteger}`;

  if (decimalDigits) {
    return `${signedValue},${decimalDigits}`;
  }

  if (keepDecimalSeparator) {
    return `${signedValue},`;
  }

  return signedValue;
};

export const formatArgentinaNumber = (value, options = {}) =>
  new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2
  }).format(Number(value || 0));

export const formatArgentinaCurrency = (value, currencyCode = 'ARS') =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));

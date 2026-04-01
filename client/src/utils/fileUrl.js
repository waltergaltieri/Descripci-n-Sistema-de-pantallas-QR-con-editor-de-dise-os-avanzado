import { resolveServerBaseUrl } from './runtimeUrls';

export const resolveFileUrl = (path) => {
  if (!path) {
    return null;
  }

  const normalizedPath = String(path).trim();

  if (!normalizedPath) {
    return null;
  }

  if (
    normalizedPath.startsWith('http') ||
    normalizedPath.startsWith('data:') ||
    normalizedPath.startsWith('blob:')
  ) {
    return normalizedPath;
  }

  if (
    normalizedPath.startsWith('#') ||
    normalizedPath.startsWith('linear-gradient(') ||
    normalizedPath.startsWith('rgb(') ||
    normalizedPath.startsWith('rgba(') ||
    normalizedPath.startsWith('hsl(') ||
    normalizedPath.startsWith('hsla(')
  ) {
    return null;
  }

  const baseUrl = resolveServerBaseUrl();

  return `${baseUrl}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
};

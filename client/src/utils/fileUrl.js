export const resolveFileUrl = (path) => {
  if (!path) {
    return null;
  }

  if (path.startsWith('http')) {
    return path;
  }

  const apiBaseUrl =
    process.env.REACT_APP_SERVER_URL ||
    process.env.REACT_APP_API_URL ||
    'http://localhost:5000/api';
  const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

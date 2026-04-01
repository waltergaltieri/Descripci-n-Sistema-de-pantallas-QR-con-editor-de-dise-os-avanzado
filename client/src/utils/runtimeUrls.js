const LOCAL_API_URL = 'http://localhost:5000/api';
const LOCAL_SERVER_URL = 'http://localhost:5000';
const LOCAL_WS_URL = 'ws://localhost:5000';

export const resolveApiBaseUrl = () =>
  process.env.REACT_APP_API_URL || LOCAL_API_URL;

export const resolveServerBaseUrl = () => {
  const serverUrl = process.env.REACT_APP_SERVER_URL;

  if (serverUrl) {
    return serverUrl;
  }

  return resolveApiBaseUrl().replace(/\/api\/?$/, '');
};

export const resolveWebSocketBaseUrl = () => {
  const wsUrl = process.env.REACT_APP_WS_URL;

  if (wsUrl) {
    return wsUrl;
  }

  const serverUrl = resolveServerBaseUrl();

  if (serverUrl.startsWith('https://')) {
    return `wss://${serverUrl.slice('https://'.length)}`;
  }

  if (serverUrl.startsWith('http://')) {
    return `ws://${serverUrl.slice('http://'.length)}`;
  }

  if (serverUrl.startsWith('wss://') || serverUrl.startsWith('ws://')) {
    return serverUrl;
  }

  if (serverUrl === LOCAL_SERVER_URL) {
    return LOCAL_WS_URL;
  }

  return serverUrl;
};

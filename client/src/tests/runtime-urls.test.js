import {
  resolveApiBaseUrl,
  resolveServerBaseUrl,
  resolveWebSocketBaseUrl,
} from '../utils/runtimeUrls';

describe('runtimeUrls', () => {
  const originalApiUrl = process.env.REACT_APP_API_URL;
  const originalServerUrl = process.env.REACT_APP_SERVER_URL;
  const originalWsUrl = process.env.REACT_APP_WS_URL;

  afterEach(() => {
    process.env.REACT_APP_API_URL = originalApiUrl;
    process.env.REACT_APP_SERVER_URL = originalServerUrl;
    process.env.REACT_APP_WS_URL = originalWsUrl;
  });

  it('falls back to the backend api on localhost:5000', () => {
    delete process.env.REACT_APP_API_URL;
    delete process.env.REACT_APP_SERVER_URL;
    delete process.env.REACT_APP_WS_URL;

    expect(resolveApiBaseUrl()).toBe('http://localhost:5000/api');
    expect(resolveServerBaseUrl()).toBe('http://localhost:5000');
    expect(resolveWebSocketBaseUrl()).toBe('ws://localhost:5000');
  });

  it('derives server and websocket urls from REACT_APP_API_URL when needed', () => {
    process.env.REACT_APP_API_URL = 'https://api.example.com/api';
    delete process.env.REACT_APP_SERVER_URL;
    delete process.env.REACT_APP_WS_URL;

    expect(resolveApiBaseUrl()).toBe('https://api.example.com/api');
    expect(resolveServerBaseUrl()).toBe('https://api.example.com');
    expect(resolveWebSocketBaseUrl()).toBe('wss://api.example.com');
  });

  it('prefers explicit server and websocket envs when present', () => {
    process.env.REACT_APP_API_URL = 'https://api.example.com/api';
    process.env.REACT_APP_SERVER_URL = 'https://app-backend.example.com';
    process.env.REACT_APP_WS_URL = 'wss://realtime.example.com';

    expect(resolveServerBaseUrl()).toBe('https://app-backend.example.com');
    expect(resolveWebSocketBaseUrl()).toBe('wss://realtime.example.com');
  });
});

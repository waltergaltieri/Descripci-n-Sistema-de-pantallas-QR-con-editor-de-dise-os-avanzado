import { resolveFileUrl } from '../utils/fileUrl';

describe('resolveFileUrl', () => {
  const originalServerUrl = process.env.REACT_APP_SERVER_URL;
  const originalApiUrl = process.env.REACT_APP_API_URL;

  beforeEach(() => {
    process.env.REACT_APP_SERVER_URL = 'https://api.example.com';
    delete process.env.REACT_APP_API_URL;
  });

  afterAll(() => {
    process.env.REACT_APP_SERVER_URL = originalServerUrl;
    process.env.REACT_APP_API_URL = originalApiUrl;
  });

  it('returns null for plain color values', () => {
    expect(resolveFileUrl('#1f2937')).toBeNull();
    expect(resolveFileUrl('linear-gradient(135deg, #111827, #2563eb)')).toBeNull();
  });

  it('keeps absolute remote and data urls intact', () => {
    expect(resolveFileUrl('https://cdn.example.com/logo.png')).toBe('https://cdn.example.com/logo.png');
    expect(resolveFileUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  });

  it('resolves app-relative upload paths against the backend base url', () => {
    expect(resolveFileUrl('/uploads/demo.png')).toBe('https://api.example.com/uploads/demo.png');
  });
});

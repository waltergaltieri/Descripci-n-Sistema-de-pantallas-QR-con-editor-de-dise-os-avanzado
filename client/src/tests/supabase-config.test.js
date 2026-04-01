describe('supabase client config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('resolves url and publishable key from env', () => {
    process.env.REACT_APP_SUPABASE_PROJECT_ID = 'qorqkcywoefkficspepx';
    process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_demo';

    const { getSupabaseBrowserConfig, isSupabaseBrowserConfigured } = require('../services/supabase');
    const config = getSupabaseBrowserConfig();

    expect(config.url).toBe('https://qorqkcywoefkficspepx.supabase.co');
    expect(config.publishableKey).toBe('sb_publishable_demo');
    expect(isSupabaseBrowserConfigured()).toBe(true);
  });
});

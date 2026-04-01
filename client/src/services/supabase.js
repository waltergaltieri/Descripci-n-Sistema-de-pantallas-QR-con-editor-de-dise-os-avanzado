import { createClient } from '@supabase/supabase-js';

export const getSupabaseBrowserConfig = (env = process.env) => {
  const projectId = env.REACT_APP_SUPABASE_PROJECT_ID?.trim();
  const explicitUrl = env.REACT_APP_SUPABASE_URL?.trim();
  const publishableKey = env.REACT_APP_SUPABASE_PUBLISHABLE_KEY?.trim() || null;
  const url = explicitUrl || (projectId ? `https://${projectId}.supabase.co` : null);

  return {
    projectId: projectId || null,
    url,
    publishableKey
  };
};

export const isSupabaseBrowserConfigured = (env = process.env) => {
  const config = getSupabaseBrowserConfig(env);
  return Boolean(config.url && config.publishableKey);
};

let browserClient = null;

export const getSupabaseBrowserClient = (env = process.env) => {
  const config = getSupabaseBrowserConfig(env);

  if (!config.url || !config.publishableKey) {
    throw new Error(
      'Faltan REACT_APP_SUPABASE_URL/REACT_APP_SUPABASE_PROJECT_ID o REACT_APP_SUPABASE_PUBLISHABLE_KEY'
    );
  }

  if (!browserClient) {
    browserClient = createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  }

  return browserClient;
};

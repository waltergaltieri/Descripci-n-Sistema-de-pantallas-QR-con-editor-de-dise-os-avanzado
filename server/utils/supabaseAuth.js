const { createSupabaseServiceClient } = require('../config/supabase');
const { resolveAppUserProfile } = require('./appAuthProfile');

const isSupabaseConfigError = (error) =>
  Boolean(error?.message) && error.message.includes('SUPABASE_');

const isIgnorableSupabaseAuthError = (error) => {
  if (!error) {
    return false;
  }

  if (isSupabaseConfigError(error)) {
    return true;
  }

  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('jwt') ||
    message.includes('token') ||
    message.includes('auth session missing') ||
    message.includes('invalid claim') ||
    message.includes('user from sub claim in jwt does not exist')
  );
};

const validateSupabaseAccessToken = async (accessToken) => {
  if (!accessToken) {
    return null;
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data?.user?.id) {
      return null;
    }

    return {
      supabaseUserId: data.user.id,
      email: data.user.email || null,
      rawUser: data.user
    };
  } catch (error) {
    if (isIgnorableSupabaseAuthError(error)) {
      return null;
    }

    throw error;
  }
};

const resolveAuthenticatedAppUser = async ({ accessToken, dbConnection }) => {
  const supabaseUser = await validateSupabaseAccessToken(accessToken);

  if (!supabaseUser) {
    return null;
  }

  const profile = await resolveAppUserProfile({
    dbConnection,
    supabaseUserId: supabaseUser.supabaseUserId
  });

  if (!profile) {
    return null;
  }

  return {
    ...profile,
    email: profile.email || supabaseUser.email,
    authProvider: 'supabase',
    supabaseUser: supabaseUser.rawUser
  };
};

module.exports = {
  validateSupabaseAccessToken,
  resolveAuthenticatedAppUser
};

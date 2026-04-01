const normalizeFlag = (value) => value === 1 || value === '1' || value === true;

const resolveAppUserProfile = async ({ dbConnection, supabaseUserId }) => {
  if (!supabaseUserId) {
    return null;
  }

  const superAdmin = await dbConnection.get(
    `
      SELECT
        id,
        email,
        full_name,
        is_active,
        supabase_user_id
      FROM super_admin_users
      WHERE supabase_user_id = ?
      LIMIT 1
    `,
    [supabaseUserId]
  );

  if (superAdmin) {
    return {
      actorType: 'super_admin',
      superAdminId: superAdmin.id,
      supabaseUserId: superAdmin.supabase_user_id,
      email: superAdmin.email,
      fullName: superAdmin.full_name,
      isActive: normalizeFlag(superAdmin.is_active),
      isBlocked: !normalizeFlag(superAdmin.is_active)
    };
  }

  const businessUser = await dbConnection.get(
    `
      SELECT
        bu.id AS business_user_id,
        bu.business_account_id,
        bu.supabase_user_id,
        bu.email,
        bu.full_name,
        bu.role,
        bu.is_active,
        ba.name AS business_name,
        ba.access_status,
        ba.commercial_status
      FROM business_users bu
      INNER JOIN business_accounts ba ON ba.id = bu.business_account_id
      WHERE bu.supabase_user_id = ?
      LIMIT 1
    `,
    [supabaseUserId]
  );

  if (!businessUser) {
    return null;
  }

  const isActive = normalizeFlag(businessUser.is_active);
  const accessStatus = businessUser.access_status || 'inactive';

  return {
    actorType: 'business_user',
    businessUserId: businessUser.business_user_id,
    businessAccountId: businessUser.business_account_id,
    businessName: businessUser.business_name,
    supabaseUserId: businessUser.supabase_user_id,
    email: businessUser.email,
    fullName: businessUser.full_name,
    role: businessUser.role,
    isActive,
    accessStatus,
    commercialStatus: businessUser.commercial_status || 'current',
    isBlocked: !isActive || accessStatus !== 'active'
  };
};

module.exports = {
  resolveAppUserProfile
};

const express = require('express');
const { db } = require('../config/database');
const { createSupabaseServiceClient } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const ACCESS_STATUSES = new Set(['active', 'suspended', 'inactive']);

const createUtcDateFromDateOnly = (value) => {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
};

const formatDateOnly = (date) => {
  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

const getTodayDateOnly = (input) => {
  if (input) {
    return formatDateOnly(createUtcDateFromDateOnly(input));
  }

  return formatDateOnly(new Date());
};

const addMonthsToDateOnly = (value, months) => {
  const source = createUtcDateFromDateOnly(value);
  if (!source) {
    return null;
  }

  const next = new Date(source.toISOString());
  next.setUTCMonth(next.getUTCMonth() + months);
  return formatDateOnly(next);
};

const getDifferenceInDays = (fromDateOnly, toDateOnly) => {
  const from = createUtcDateFromDateOnly(fromDateOnly);
  const to = createUtcDateFromDateOnly(toDateOnly);

  if (!from || !to) {
    return null;
  }

  return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
};

const deriveCommercialStatus = ({ nextDueDate, reminderDaysBefore }, todayDateOnly) => {
  if (!nextDueDate) {
    return 'current';
  }

  const daysUntilDue = getDifferenceInDays(todayDateOnly, nextDueDate);
  if (daysUntilDue === null) {
    return 'current';
  }

  if (daysUntilDue < 0) {
    return 'overdue';
  }

  if (daysUntilDue <= (reminderDaysBefore ?? 7)) {
    return 'due_soon';
  }

  return 'current';
};

const toAmountCents = (amount) => {
  if (amount === undefined || amount === null || amount === '') {
    return 0;
  }

  return Math.round(Number(amount) * 100);
};

const normalizeClientRow = (row, todayDateOnly) => {
  const commercialStatus = deriveCommercialStatus(
    {
      nextDueDate: row.next_due_date,
      reminderDaysBefore: row.reminder_days_before
    },
    todayDateOnly
  );

  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name || null,
    address: row.address || null,
    contactPerson: row.contact_person || null,
    contactEmail: row.contact_email || null,
    contactPhone: row.contact_phone || null,
    notes: row.notes || null,
    accessStatus: row.access_status,
    commercialStatus,
    timezone: row.timezone || 'America/Buenos_Aires',
    currencyCode: row.currency_code || row.billing_currency_code || 'ARS',
    billingAmount: Number(((row.billing_amount_cents || 0) / 100).toFixed(2)),
    billingAmountCents: row.billing_amount_cents || 0,
    billingCurrencyCode: row.billing_currency_code || 'ARS',
    firstPaymentDate: row.first_payment_date || null,
    lastPaymentMarkedAt: row.last_payment_marked_at || null,
    nextDueDate: row.next_due_date || null,
    reminderDaysBefore: row.reminder_days_before ?? 7,
    owner: row.owner_email
      ? {
          email: row.owner_email,
          fullName: row.owner_full_name || null,
          role: row.owner_role || 'owner',
          supabaseUserId: row.owner_supabase_user_id || null
        }
      : null,
    billing: {
      billingAmount: Number(((row.billing_amount_cents || 0) / 100).toFixed(2)),
      billingAmountCents: row.billing_amount_cents || 0,
      billingCurrencyCode: row.billing_currency_code || 'ARS',
      firstPaymentDate: row.first_payment_date || null,
      lastPaymentMarkedAt: row.last_payment_marked_at || null,
      nextDueDate: row.next_due_date || null,
      reminderDaysBefore: row.reminder_days_before ?? 7
    }
  };
};

const requireSuperAdmin = (req, res, next) => {
  if (req.user?.actorType !== 'super_admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo super admins.' });
  }

  next();
};

const insertBillingEvent = async ({
  businessAccountId,
  eventType,
  amountCents = null,
  notes = null,
  superAdminId = null
}) => {
  await db().run(
    `
      INSERT INTO billing_events (
        business_account_id,
        event_type,
        amount_cents,
        notes,
        created_by_super_admin_id
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [businessAccountId, eventType, amountCents, notes, superAdminId]
  );
};

const loadClientRow = async (businessAccountId) =>
  db().get(
    `
      SELECT
        ba.id,
        ba.name,
        ba.legal_name,
        ba.address,
        ba.contact_phone,
        ba.contact_person,
        ba.contact_email,
        ba.notes,
        ba.timezone,
        ba.currency_code,
        ba.access_status,
        bp.first_payment_date,
        bp.billing_amount_cents,
        bp.billing_currency_code,
        bp.last_payment_marked_at,
        bp.next_due_date,
        bp.reminder_days_before,
        bu.email AS owner_email,
        bu.full_name AS owner_full_name,
        bu.role AS owner_role,
        bu.supabase_user_id AS owner_supabase_user_id
      FROM business_accounts ba
      LEFT JOIN billing_profiles bp ON bp.business_account_id = ba.id
      LEFT JOIN business_users bu ON bu.business_account_id = ba.id AND bu.role = 'owner'
      WHERE ba.id = ?
      LIMIT 1
    `,
    [businessAccountId]
  );

const loadOwnerUserRow = async (businessAccountId) =>
  db().get(
    `
      SELECT
        id,
        business_account_id,
        supabase_user_id,
        email,
        full_name,
        role,
        is_active
      FROM business_users
      WHERE business_account_id = ? AND role = 'owner'
      LIMIT 1
    `,
    [businessAccountId]
  );

router.use(authenticateToken, requireAdmin, requireSuperAdmin);

router.get('/dashboard', async (req, res) => {
  try {
    const todayDateOnly = getTodayDateOnly(req.query.today);
    const rows = await db().all(
      `
        SELECT
          ba.id,
          ba.access_status,
          bp.next_due_date,
          bp.reminder_days_before
        FROM business_accounts ba
        LEFT JOIN billing_profiles bp ON bp.business_account_id = ba.id
      `
    );

    const metrics = rows.reduce(
      (accumulator, row) => {
        accumulator.totalClients += 1;

        if (row.access_status === 'active') accumulator.activeClients += 1;
        if (row.access_status === 'suspended') accumulator.suspendedClients += 1;
        if (row.access_status === 'inactive') accumulator.inactiveClients += 1;

        const status = deriveCommercialStatus(
          {
            nextDueDate: row.next_due_date,
            reminderDaysBefore: row.reminder_days_before
          },
          todayDateOnly
        );

        if (status === 'due_soon') accumulator.dueSoonClients += 1;
        if (status === 'overdue') accumulator.overdueClients += 1;

        return accumulator;
      },
      {
        totalClients: 0,
        activeClients: 0,
        suspendedClients: 0,
        inactiveClients: 0,
        dueSoonClients: 0,
        overdueClients: 0
      }
    );

    res.json({ metrics });
  } catch (error) {
    console.error('Error al cargar dashboard de super admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/clients', async (req, res) => {
  try {
    const todayDateOnly = getTodayDateOnly(req.query.today);
    const rows = await db().all(
      `
        SELECT
          ba.id,
          ba.name,
          ba.legal_name,
          ba.address,
          ba.contact_phone,
          ba.contact_person,
          ba.contact_email,
          ba.notes,
          ba.timezone,
          ba.currency_code,
          ba.access_status,
          ba.commercial_status,
          bp.first_payment_date,
          bp.billing_amount_cents,
          bp.billing_currency_code,
          bp.last_payment_marked_at,
          bp.next_due_date,
          bp.reminder_days_before,
          bu.email AS owner_email,
          bu.full_name AS owner_full_name,
          bu.role AS owner_role,
          bu.supabase_user_id AS owner_supabase_user_id
        FROM business_accounts ba
        LEFT JOIN billing_profiles bp ON bp.business_account_id = ba.id
        LEFT JOIN business_users bu ON bu.business_account_id = ba.id AND bu.role = 'owner'
        ORDER BY ba.created_at DESC, ba.id DESC
      `
    );

    let clients = rows.map((row) => normalizeClientRow(row, todayDateOnly));

    if (req.query.accessStatus) {
      clients = clients.filter((client) => client.accessStatus === req.query.accessStatus);
    }

    if (req.query.commercialStatus) {
      clients = clients.filter((client) => client.commercialStatus === req.query.commercialStatus);
    }

    if (req.query.search) {
      const needle = req.query.search.trim().toLowerCase();
      clients = clients.filter((client) =>
        [client.name, client.contactPerson, client.contactEmail, client.owner?.email]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(needle))
      );
    }

    res.json(clients);
  } catch (error) {
    console.error('Error al listar clientes de super admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/clients/:id', async (req, res) => {
  try {
    const todayDateOnly = getTodayDateOnly(req.query.today);
    const clientRow = await loadClientRow(req.params.id);

    if (!clientRow) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const events = await db().all(
      `
        SELECT
          id,
          event_type,
          amount_cents,
          notes,
          event_date,
          created_by_super_admin_id
        FROM billing_events
        WHERE business_account_id = ?
        ORDER BY event_date DESC, id DESC
      `,
      [req.params.id]
    );

    res.json({
      client: {
        ...normalizeClientRow(clientRow, todayDateOnly),
        events: events.map((event) => ({
          id: event.id,
          eventType: event.event_type,
          amount: Number((((event.amount_cents || 0) / 100)).toFixed(2)),
          amountCents: event.amount_cents || 0,
          notes: event.notes || null,
          eventDate: event.event_date,
          createdBySuperAdminId: event.created_by_super_admin_id || null
        }))
      }
    });
  } catch (error) {
    console.error('Error al cargar detalle de cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/clients', async (req, res) => {
  let createdSupabaseUserId = null;

  try {
    const {
      name,
      legalName,
      address,
      contactPhone,
      contactPerson,
      contactEmail,
      ownerFullName,
      ownerEmail,
      password,
      firstPaymentDate,
      billingAmount,
      notes
    } = req.body;

    if (!name || !ownerEmail || !password || !firstPaymentDate) {
      return res.status(400).json({ error: 'Nombre, email del owner, password y primer pago son requeridos' });
    }

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email: ownerEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: ownerFullName || contactPerson || null
      }
    });

    if (error || !data?.user?.id) {
      return res.status(400).json({ error: error?.message || 'No se pudo crear el usuario en Supabase Auth' });
    }

    createdSupabaseUserId = data.user.id;

    const businessAccountResult = await db().run(
      `
        INSERT INTO business_accounts (
          name,
          legal_name,
          address,
          contact_phone,
          contact_person,
          contact_email,
          notes,
          access_status,
          commercial_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        legalName || null,
        address || null,
        contactPhone || null,
        contactPerson || ownerFullName || null,
        contactEmail || ownerEmail,
        notes || null,
        'active',
        'current'
      ]
    );

    const businessAccountId =
      businessAccountResult.lastID ??
      businessAccountResult.lastInsertRowid ??
      businessAccountResult.id;

    await db().run(
      `
        INSERT INTO business_users (
          business_account_id,
          supabase_user_id,
          email,
          full_name,
          role,
          is_active
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        businessAccountId,
        createdSupabaseUserId,
        ownerEmail,
        ownerFullName || contactPerson || null,
        'owner',
        1
      ]
    );

    const billingAmountCents = toAmountCents(billingAmount);

    await db().run(
      `
        INSERT INTO billing_profiles (
          business_account_id,
          first_payment_date,
          billing_amount_cents,
          billing_currency_code,
          billing_frequency,
          next_due_date,
          reminder_days_before
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [businessAccountId, firstPaymentDate, billingAmountCents, 'ARS', 'monthly', firstPaymentDate, 7]
    );

    await insertBillingEvent({
      businessAccountId,
      eventType: 'access_activated',
      amountCents: billingAmountCents,
      notes: 'Cliente creado desde panel super admin',
      superAdminId: req.user?.superAdminId || null
    });

    res.status(201).json({
      client: {
        id: businessAccountId,
        name,
        accessStatus: 'active',
        commercialStatus: 'current',
        owner: {
          email: ownerEmail,
          fullName: ownerFullName || contactPerson || null,
          role: 'owner',
          supabaseUserId: createdSupabaseUserId
        },
        billing: {
          firstPaymentDate,
          nextDueDate: firstPaymentDate,
          billingAmount: Number((billingAmountCents / 100).toFixed(2)),
          billingAmountCents
        }
      }
    });
  } catch (error) {
    if (createdSupabaseUserId) {
      try {
        const supabase = createSupabaseServiceClient();
        await supabase.auth.admin.deleteUser?.(createdSupabaseUserId);
      } catch (cleanupError) {
        console.error('Error al limpiar usuario Supabase tras fallo de alta:', cleanupError);
      }
    }

    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/clients/:id', async (req, res) => {
  try {
    const businessAccountId = req.params.id;
    const existingClient = await loadClientRow(businessAccountId);

    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const ownerUser = await loadOwnerUserRow(businessAccountId);

    if (!ownerUser?.supabase_user_id) {
      return res.status(404).json({ error: 'Usuario owner no encontrado' });
    }

    const {
      name,
      legalName,
      address,
      contactPhone,
      contactPerson,
      contactEmail,
      ownerFullName,
      ownerEmail,
      notes
    } = req.body;

    if (!name || !ownerEmail) {
      return res.status(400).json({ error: 'Nombre del negocio y correo del owner son requeridos' });
    }

    const supabase = createSupabaseServiceClient();
    const ownerPayload = {
      email: ownerEmail,
      user_metadata: {
        full_name: ownerFullName || contactPerson || null
      }
    };
    const updateOwnerResult = await supabase.auth.admin.updateUserById(
      ownerUser.supabase_user_id,
      ownerPayload
    );

    if (updateOwnerResult.error) {
      return res.status(400).json({
        error: updateOwnerResult.error.message || 'No se pudo actualizar el owner en Supabase Auth'
      });
    }

    await db().run(
      `
        UPDATE business_accounts
        SET
          name = ?,
          legal_name = ?,
          address = ?,
          contact_phone = ?,
          contact_person = ?,
          contact_email = ?,
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        name,
        legalName || null,
        address || null,
        contactPhone || null,
        contactPerson || ownerFullName || null,
        contactEmail || ownerEmail,
        notes || null,
        businessAccountId
      ]
    );

    await db().run(
      `
        UPDATE business_users
        SET
          email = ?,
          full_name = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE business_account_id = ? AND role = 'owner'
      `,
      [ownerEmail, ownerFullName || contactPerson || null, businessAccountId]
    );

    await insertBillingEvent({
      businessAccountId,
      eventType: 'note_added',
      notes: 'Datos del cliente y owner actualizados desde super admin',
      superAdminId: req.user?.superAdminId || null
    });

    const updatedClient = await loadClientRow(businessAccountId);
    const todayDateOnly = getTodayDateOnly(req.query?.today);

    res.json({
      client: normalizeClientRow(updatedClient || existingClient, todayDateOnly)
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/clients/:id/reset-password', async (req, res) => {
  try {
    const businessAccountId = req.params.id;
    const { password, notes } = req.body;

    if (!password || String(password).trim().length < 8) {
      return res.status(400).json({ error: 'La nueva contrasena debe tener al menos 8 caracteres' });
    }

    const ownerUser = await loadOwnerUserRow(businessAccountId);

    if (!ownerUser?.supabase_user_id) {
      return res.status(404).json({ error: 'Usuario owner no encontrado' });
    }

    const supabase = createSupabaseServiceClient();
    const resetPasswordResult = await supabase.auth.admin.updateUserById(
      ownerUser.supabase_user_id,
      {
        password
      }
    );

    if (resetPasswordResult.error) {
      return res.status(400).json({
        error: resetPasswordResult.error.message || 'No se pudo resetear la contrasena del owner'
      });
    }

    await insertBillingEvent({
      businessAccountId,
      eventType: 'note_added',
      notes: notes || 'Contrasena del owner reseteada desde super admin',
      superAdminId: req.user?.superAdminId || null
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error al resetear contrasena del owner:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/clients/:id/mark-payment', async (req, res) => {
  try {
    const billingProfile = await db().get(
      `
        SELECT
          business_account_id,
          first_payment_date,
          next_due_date,
          billing_amount_cents,
          billing_currency_code,
          reminder_days_before
        FROM billing_profiles
        WHERE business_account_id = ?
        LIMIT 1
      `,
      [req.params.id]
    );

    if (!billingProfile) {
      return res.status(404).json({ error: 'Perfil de facturacion no encontrado' });
    }

    const paymentDate = req.body.paymentDate || new Date().toISOString();
    const paymentDateOnly = formatDateOnly(new Date(paymentDate));
    const nextDueDate = addMonthsToDateOnly(
      billingProfile.next_due_date || billingProfile.first_payment_date || paymentDateOnly,
      1
    );
    const amountCents =
      req.body.amount !== undefined
        ? toAmountCents(req.body.amount)
        : billingProfile.billing_amount_cents;

    await db().run(
      `
        UPDATE billing_profiles
        SET
          last_payment_marked_at = ?,
          next_due_date = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE business_account_id = ?
      `,
      [paymentDate, nextDueDate, req.params.id]
    );

    await insertBillingEvent({
      businessAccountId: req.params.id,
      eventType: 'payment_marked',
      amountCents,
      notes: req.body.notes || null,
      superAdminId: req.user?.superAdminId || null
    });

    res.json({
      client: {
        id: Number(req.params.id),
        commercialStatus: 'current',
        billing: {
          lastPaymentMarkedAt: paymentDate,
          nextDueDate,
          billingAmount: Number((amountCents / 100).toFixed(2)),
          billingAmountCents: amountCents,
          billingCurrencyCode: billingProfile.billing_currency_code || 'ARS'
        }
      }
    });
  } catch (error) {
    console.error('Error al marcar pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/clients/:id/access-status', async (req, res) => {
  try {
    const { accessStatus, notes } = req.body;

    if (!ACCESS_STATUSES.has(accessStatus)) {
      return res.status(400).json({ error: 'Estado de acceso invalido' });
    }

    const businessAccount = await db().get(
      `
        SELECT id, access_status
        FROM business_accounts
        WHERE id = ?
        LIMIT 1
      `,
      [req.params.id]
    );

    if (!businessAccount) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await db().run(
      `
        UPDATE business_accounts
        SET access_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [accessStatus, req.params.id]
    );

    const eventType =
      accessStatus === 'active'
        ? 'access_activated'
        : accessStatus === 'suspended'
          ? 'access_suspended'
          : 'access_inactivated';

    await insertBillingEvent({
      businessAccountId: req.params.id,
      eventType,
      notes: notes || null,
      superAdminId: req.user?.superAdminId || null
    });

    res.json({
      client: {
        id: Number(req.params.id),
        accessStatus
      }
    });
  } catch (error) {
    console.error('Error al actualizar acceso del cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

const mongoose = require('mongoose');

/**
 * Slugifies the "local part" of an email into a valid username.
 *   "joao.silva+test@loja.com" → "joao.silva.test"
 *   "MyUser_123@x.com"          → "myuser_123"
 */
const usernameFromEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  const local = email.split('@')[0] || '';
  return local
    .toLowerCase()
    .replace(/\+/g, '.')
    .replace(/[^a-z0-9._]/g, '')
    .replace(/^[._]+|[._]+$/g, '')
    .substring(0, 30);
};

/**
 * Reads `users` documents that still carry `email` (and no `username`),
 * derives a username from the email's local part, ensures uniqueness,
 * then unsets the email field. Bypasses the schema (raw collection) so
 * legacy docs with deprecated fields still load.
 *
 * Idempotent: safe to run on every server start.
 *
 * Runs against the admin DB connection (the one mongoose.connect() opened),
 * since users live in `invaai_admin`.
 */
const migrateUsersEmailToUsername = async () => {
  const conn = mongoose.connection;
  if (conn.readyState !== 1) {
    console.warn('[Migrate] Skipping users migration — admin DB not ready.');
    return;
  }

  const usersCol = conn.db.collection('users');

  const legacy = await usersCol
    .find({ email: { $exists: true }, $or: [{ username: { $exists: false } }, { username: null }, { username: '' }] })
    .toArray();

  if (legacy.length === 0) {
    // also clean up any leftover email field on already-migrated docs
    const cleanup = await usersCol.updateMany(
      { email: { $exists: true }, username: { $exists: true, $ne: null, $nin: [''] } },
      { $unset: { email: 1 } }
    );
    if (cleanup.modifiedCount > 0) {
      console.log(`[Migrate] Removed leftover email field from ${cleanup.modifiedCount} migrated user(s).`);
    }
    return;
  }

  console.log(`[Migrate] Converting ${legacy.length} user(s) email→username...`);

  const takenUsernames = new Set(
    (await usersCol.find({ username: { $exists: true, $ne: null } }).project({ username: 1 }).toArray())
      .map((u) => (u.username || '').toLowerCase())
      .filter(Boolean)
  );

  for (const user of legacy) {
    let base = usernameFromEmail(user.email);
    if (!base || base.length < 3) {
      base = `user${String(user._id).slice(-6)}`;
    }

    let candidate = base;
    let suffix = 1;
    while (takenUsernames.has(candidate)) {
      candidate = `${base}${suffix}`;
      suffix += 1;
    }
    takenUsernames.add(candidate);

    await usersCol.updateOne(
      { _id: user._id },
      { $set: { username: candidate }, $unset: { email: 1 } }
    );

    console.log(`[Migrate]   ${user.email} → ${candidate}`);
  }

  // Drop the legacy unique index on email if it still exists.
  try {
    const indexes = await usersCol.indexes();
    if (indexes.some((idx) => idx.name === 'email_1')) {
      await usersCol.dropIndex('email_1');
      console.log('[Migrate] Dropped legacy index email_1.');
    }
  } catch (err) {
    // index may not exist — ignore
  }

  console.log('[Migrate] Done — email→username migration complete.');
};

module.exports = { migrateUsersEmailToUsername, usernameFromEmail };

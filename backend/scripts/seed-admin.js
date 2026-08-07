/**
 * Creates (or promotes) the single root administrator.
 *
 * Admin cannot be self-granted: signup whitelists only 'user' and 'creator' (see
 * authService.SIGNUP_ROLES), and the role endpoint requires an existing admin to promote
 * anyone. That leaves a bootstrap problem - the first admin has to come from outside the
 * API, which is what this script is for. Run it once, from a trusted machine with database
 * access.
 *
 *   npm run seed:admin -- --email you@example.com
 *
 * If the email already belongs to an account, that account is promoted and its password is
 * left untouched. If it does not, a new account is created and you will be prompted for a
 * password via ADMIN_PASSWORD.
 *
 *   ADMIN_PASSWORD='a-strong-password' npm run seed:admin -- --email you@example.com --name 'Your Name'
 *
 * Refuses to run twice: if a root admin already exists it reports who and exits, rather than
 * quietly minting a second one.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/userModel.js';

dotenv.config({ path: './config.env' });

const arg = (flag) => {
  const at = process.argv.indexOf(flag);
  return at !== -1 ? process.argv[at + 1] : undefined;
};

const run = async () => {
  const email = arg('--email')?.toLowerCase().trim();
  const name = arg('--name') ?? 'Root Administrator';
  const force = process.argv.includes('--force');

  if (!email) {
    throw new Error(
      'Usage: npm run seed:admin -- --email you@example.com [--name "Your Name"] [--force]',
    );
  }

  const DB = process.env.DB;
  if (!DB) throw new Error('DB connection string missing from config.env');

  await mongoose.connect(DB);

  const existingRoot = await User.findOne({ isRootAdmin: true }).select(
    '+role +isRootAdmin',
  );
  if (existingRoot && !force) {
    console.warn(
      `A root admin already exists: ${existingRoot.name} <${existingRoot.email}>.\n` +
        'Re-run with --force to move root status to a different account.',
    );
    await mongoose.disconnect();
    return;
  }

  let user = await User.findOne({ email }).select('+role +isRootAdmin');

  if (user) {
    user.role = 'admin';
    user.isRootAdmin = true;
    // validateBeforeSave: false - the document has no passwordConfirm in memory, and the
    // schema requires it on save. Nothing here touches the password.
    await user.save({ validateBeforeSave: false });
    console.warn(`Promoted existing account to root admin: ${email}`);
  } else {
    const password = process.env.ADMIN_PASSWORD;
    if (!password || password.length < 8) {
      throw new Error(
        'No account with that email exists, so one must be created - set ADMIN_PASSWORD ' +
          '(at least 8 characters) and re-run.',
      );
    }
    user = await User.create({
      name,
      email,
      password,
      passwordConfirm: password,
      role: 'admin',
      isRootAdmin: true,
    });
    console.warn(`Created root admin: ${email}`);
  }

  // Demote any other root, so the invariant "exactly one root admin" holds after --force.
  const demoted = await User.updateMany(
    { _id: { $ne: user._id }, isRootAdmin: true },
    { $set: { isRootAdmin: false } },
  );
  if (demoted.modifiedCount) {
    console.warn(
      `Removed root status from ${demoted.modifiedCount} other account(s).`,
    );
  }

  console.warn('Done. Sign in normally - the role takes effect on next login.');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('seed-admin failed:', err.message);
  process.exit(1);
});

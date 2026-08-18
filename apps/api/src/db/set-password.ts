/**
 * Rotate a user's password from the command line.
 *
 * Admin accounts can't be created or reset through the public API by design,
 * so this is the supported way to change one.
 *
 *   npm run set-password -w @insta-fumigation/api -- admin@example.com
 *
 * Pass the password as the second argument only for non-interactive use — it
 * will land in your shell history. Omit it and you'll be prompted instead.
 */
import bcrypt from 'bcryptjs';
import readline from 'readline';
import { pool } from './index';

const MIN_LENGTH = 12;

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('Usage: set-password <email> [newPassword]');
    process.exit(1);
  }

  const password = process.argv[3] ?? (await prompt(`New password for ${email}: `));
  if (password.length < MIN_LENGTH) {
    console.error(`Password must be at least ${MIN_LENGTH} characters.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    `UPDATE users SET password_hash = $1, updated_at = NOW()
     WHERE LOWER(email) = $2 RETURNING id, email, role`,
    [hash, email]
  );

  if (result.rowCount === 0) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }

  const user = result.rows[0];
  console.log(`Password updated for ${user.email} (${user.role}).`);
  console.log('Existing sessions stay valid until their token expires — deactivate and');
  console.log('reactivate the account if you need to cut them off immediately.');
  await pool.end();
}

main().catch((err) => {
  console.error('Failed:', err?.message);
  process.exit(1);
});

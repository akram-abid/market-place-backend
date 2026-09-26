import { pool } from "../../config/db.js";

export async function createRefreshToken({ userId, tokenHash, expiresAt }) {
  const result = await pool.query(
    `insert into refresh_tokens (user_id, token_hash, expires_at)
        values ($1, $2, $3)
        returning id, user_id, expires_at`,
    [userId, tokenHash, expiresAt],
  );

  return result.rows[0];
}

export async function findRefreshTokenByHash(tokenHash) {
  const result = await pool.query(
    `select * from refresh_tokens where token_hash = $1 
    and revoked_at is null 
    and expires_at > now()`,
    [tokenHash],
  );

  return result.rows[0];
}

export async function revokeRefreshToken(id) {
  await pool.query(`update refresh_tokens set revoked_at = now() at id=$1`, [id]);
}

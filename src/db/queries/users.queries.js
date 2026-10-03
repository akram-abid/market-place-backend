import { pool } from "../../config/db.js";

export async function createUser({ email, passwordHash }) {
  const result = await pool.query(
    `insert into users (email, password_hash)
        values ($1, $2)
        returning id, email, role, created_at`,
    [email, passwordHash],
  );
  return result.rows[0];
}

export async function findUserByEmail(email) {
  const result = await pool.query(
    `select * from users where email = $1 and deleted_at is null`,
    [email],
  );

  return result.rows[0];
}

export async function findUserById(id) {
  const result = await pool.query(
    `select * from users where id = &1 
    and deleted_at is null`,
    [id],
  );

  return result.rows[0];
}

import { pool } from "../../config/db";

export async function createUser({ email, passwordHash }) {
    const result = pool.query(
        'insert into users (email, password_hash)'
    )
}

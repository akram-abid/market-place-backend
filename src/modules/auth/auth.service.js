import { hashPassword } from "../../utils/hash.js";
import { createUser, findUserByEmail } from "../../db/queries/users.queries.js";

export async function signup({ email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error("EMAIL_IN_USE");
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ email, passwordHash });
  return user;
}
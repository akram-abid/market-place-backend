import { hashPassword, verifyPassword } from "../../utils/hash.js";
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

export async function login({ email, password }) {
  const user = await findUserByEmail(email);
  console.log("looked up:", email, "-> found:", user);
  if (!user) {
    console.log("i guess this wont appear");
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordVerified = await verifyPassword(user.password_hash, password);

  if (!passwordVerified) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return user;
}

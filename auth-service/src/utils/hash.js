import argon2 from "argon2";

export async function hashPassword(plainPassword) {
  return argon2.hash(plainPassword);
}

export async function verifyPassword(hash, plainPassword) {
  return argon2.verify(hash, plainPassword);
}

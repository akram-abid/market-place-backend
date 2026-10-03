import { hashPassword, verifyPassword } from "../../utils/hash.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
} from "../../db/queries/users.queries.js";
import {
  generateRrefreshToken,
  hashToken,
  signAccessToken,
} from "../../utils/jwt.js";
import {
  createRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshToken,
} from "../../db/queries/refreshTokens.queries.js";

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
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordVerified = await verifyPassword(user.password_hash, password);

  if (!passwordVerified) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const refreshToken = generateRrefreshToken();
  const hashedRefreshToken = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  createRefreshToken({
    userId: user.id,
    tokenHash: hashedRefreshToken,
    expiresAt,
  });

  return { user, refreshToken };
}

export async function refreshAcessToken({ refreshToken }) {
  const hashplainRefreshToken = hashToken(refreshToken);
  const refreshTokenRow = findRefreshTokenByHash(hashplainRefreshToken);

  if (foundRefreshToken) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  revokeRefreshToken(refreshTokenRow.id);
  const newRefreshToken = generateRrefreshToken();
  const hashNewRefreshToken = hashToken(newRefreshToken);
  const { user_id, id } = createRefreshToken();

  const user = findUserById(user_id);
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(payload);

  return {accessToken, refreshToken: newRefreshToken}
}

import { verifyAccessToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization;
    const token = authorization.replace("Bearer ", "");

    const result = verifyAccessToken(token);
    req.user = result;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

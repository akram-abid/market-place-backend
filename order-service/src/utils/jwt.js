import jwt from "jsonwebtoken";
import crypto from "crypto"

export function signAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "15m"})
}

export function verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET)
}

export function generateRefreshToken() {
    return crypto.randomBytes(40).toString("hex")
}

export function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex")
}
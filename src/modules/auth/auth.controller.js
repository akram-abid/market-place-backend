import { findUserByEmail } from "../../db/queries/users.queries.js";
import { signAccessToken } from "../../utils/jwt.js";
import { login, refreshAcessToken, signup } from "./auth.service.js";

export async function signupController(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await signup({ email, password });
    res.status(201).json({ user });
  } catch (err) {
    if (err.message === "EMAIL_IN_USE") {
      return res.status(409).json({ error: "email already in use" });
    }
    res.status(500).json({ error: "something went wrong" });
  }
}

export async function loginController(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const { user, refreshToken } = await login({ email, password });

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const token = signAccessToken(payload);

    return res
      .status(200)
      .json({ accessToken: token, refreshToken: refreshToken });
  } catch (err) {
    console.error(err);
    if (err.message === "INVALID_CREDENTIALS") {
      console.log("so i am here butt wtf");
      return res.status(401).json({ error: "invalid credentials" });
    }

    return res.status(500).json({ error: "something went wrong" });
  }
}

export async function refreshController(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "refreshToken is required" });
    }
    console.log("the refresh token that i am trying to use ", refreshToken)
    const result = await refreshAcessToken({ refreshToken });
    return res.status(200).json(result);
  } catch (err) {
    if (err.message === "INVALID_REFRESH_TOKEN") {
      return res.status(400).json({ error: "invalid or expired refresh token" });
    }
    console.error(err)
    return res.status(500).json({error: "something went wrong"})
  }
}

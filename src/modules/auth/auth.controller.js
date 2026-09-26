import { signup } from "./auth.service.js";

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
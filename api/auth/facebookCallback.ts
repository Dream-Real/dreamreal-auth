import { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL!;
const SESSION_SECRET = process.env.SESSION_SECRET!;
const MOBILE_REDIRECT_URI = process.env.MOBILE_REDIRECT_URI || "dreamreal://auth";

export default async function facebookCallback(req: VercelRequest, res: VercelResponse) {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "Missing code" });

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_CALLBACK_URL}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`
    );
    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) return res.status(400).json({ error: "No access_token", tokenData });

    const facebookAccessToken = tokenData.access_token;

    const profileResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${facebookAccessToken}`
    );
    const profile = await profileResponse.json();
    console.log("👤 Profil Facebook reçu:", profile);

    const userPayload = {
      id: profile.id,
      name: profile.name,
      email: profile.email ?? "unknown@facebook.com",
      photo: profile.picture?.data?.url ?? null,
    };
    const token = jwt.sign({ user: userPayload }, SESSION_SECRET, { expiresIn: "7d" });

    const redirectUrl = `${MOBILE_REDIRECT_URI}?token=${token}&facebook_access_token=${facebookAccessToken}`;
    console.log("🔁 Redirection vers:", redirectUrl);

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("❌ Erreur facebookCallback:", err);
    return res.status(500).json({ error: "Erreur OAuth Facebook" });
  }
}

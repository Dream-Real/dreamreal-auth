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

    if (!code) {
      return res.status(400).json({ error: "Missing Facebook code" });
    }

    // 1️⃣ Échange du code contre un access_token Facebook
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_CALLBACK_URL}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("❌ Erreur récupération access_token:", tokenData);
      return res.status(400).json({ error: "Erreur lors de l’obtention du access_token", tokenData });
    }

    const facebookAccessToken = tokenData.access_token;

    // 2️⃣ Récupération du profil utilisateur
    const profileResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${facebookAccessToken}`
    );
    const profileData = await profileResponse.json();

    console.log("👤 Profil Facebook:", profileData);

    // 3️⃣ Création du JWT pour ton app
    const userPayload = {
      id: profileData.id,
      name: profileData.name,
      email: profileData.email ?? "unknown@facebook.com",
      photo: profileData.picture?.data?.url ?? null,
    };

    const token = jwt.sign({ user: userPayload }, SESSION_SECRET, { expiresIn: "7d" });

    // 4️⃣ Redirection finale vers ton app mobile
    const redirectUrl = `${MOBILE_REDIRECT_URI}?token=${token}&facebook_access_token=${facebookAccessToken}`;
    console.log("🔁 Redirection mobile →", redirectUrl);

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("❌ Erreur dans facebookCallback:", err);
    return res.status(500).json({ error: "Erreur interne Facebook callback" });
  }
}
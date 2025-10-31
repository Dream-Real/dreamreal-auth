import type { VercelRequest, VercelResponse } from "@vercel/node";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

dotenv.config();

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL!;
const SESSION_SECRET = process.env.SESSION_SECRET!;
const MOBILE_REDIRECT_URI = process.env.MOBILE_REDIRECT_URI || "dreamreal://auth";

export default async function facebookcallback(req: VercelRequest, res: VercelResponse) {
  try {
    const { code } = req.query;
    console.log("📩 Facebook callback reçu avec code:", code);

    if (!code) {
      return res.status(400).json({ error: "Missing authorization code" });
    }

    // 1️⃣ Échange du code contre un access_token Facebook
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_CALLBACK_URL}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`
    );
    const tokenData: any = await tokenRes.json();
    console.log("🔑 Réponse token Facebook:", tokenData);

    if (!tokenData.access_token) {
      return res.status(400).json({ error: "Impossible d’obtenir un access_token Facebook", details: tokenData });
    }

    const facebookAccessToken = tokenData.access_token;

    // 2️⃣ Récupération du profil utilisateur
    const profileRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${facebookAccessToken}`
    );
    const profileData: any = await profileRes.json();
    console.log("👤 Profil Facebook:", profileData);

    const userPayload = {
      id: profileData.id,
      name: profileData.name,
      email: profileData.email ?? "unknown@facebook.com",
      photo: profileData.picture?.data?.url ?? null,
    };

    // 3️⃣ Création du JWT local
    const token = jwt.sign({ user: userPayload }, SESSION_SECRET, { expiresIn: "7d" });
    const redirectUrl = `${MOBILE_REDIRECT_URI}?token=${token}&fb_token=${facebookAccessToken}`;

    console.log("🔁 Redirection finale vers mobile:", redirectUrl);
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("❌ Erreur dans facebookcallback:", error);
    return res.status(500).json({ error: "Erreur interne OAuth Facebook" });
  }
}
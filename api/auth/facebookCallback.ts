import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL!;
const MOBILE_REDIRECT_URI = process.env.MOBILE_REDIRECT_URI!;
const JWT_SECRET = process.env.SESSION_SECRET!;

export default async function facebookCallback(req: VercelRequest, res: VercelResponse) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Missing Facebook authorization code" });
    }

    // 1️⃣ Échanger le code contre un access_token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_CALLBACK_URL}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`
    );

    const tokenData: any = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("❌ Erreur tokenData:", tokenData);
      return res.status(400).json({ error: "Facebook token retrieval failed" });
    }

    // 2️⃣ Récupérer les infos du profil utilisateur
    const profileResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`
    );

    const profileData: any = await profileResponse.json();

    if (!profileData.id) {
      console.error("❌ Erreur profileData:", profileData);
      return res.status(400).json({ error: "Facebook profile retrieval failed" });
    }

    // 3️⃣ Créer un JWT avec les infos utilisateur
    const token = jwt.sign(
      {
        user: {
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
        },
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Facebook user reçu :", profileData);
    console.log("🔑 Token généré :", token);

    // 4️⃣ Redirection vers l’app mobile
    const redirectUrl = `${MOBILE_REDIRECT_URI}?token=${token}`;
    console.log("🔁 Redirection vers:", redirectUrl);
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("❌ Erreur facebookCallback:", err);
    return res.status(500).json({ error: "Erreur interne callback Facebook" });
  }
}
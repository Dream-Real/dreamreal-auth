import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

// 🔐 Variables d’environnement
const {
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  FACEBOOK_CALLBACK_URL,
  SESSION_SECRET,
  MOBILE_REDIRECT_URI = "dreamreal://auth",
} = process.env;

// 🚀 Étape 2 — Callback de Facebook après login
export default async function facebookCallback(req: VercelRequest, res: VercelResponse) {
  try {
    const code = req.query.code as string;
    if (!code) {
      console.error("❌ Aucun code OAuth reçu.");
      return res.status(400).json({ error: "Missing authorization code" });
    }

    console.log("📩 Code OAuth reçu de Facebook:", code);

    // 1️⃣ Échanger le code contre un access_token Facebook
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_CALLBACK_URL}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`;
    console.log("🔄 Récupération access_token depuis:", tokenUrl);

    const tokenResponse = await fetch(tokenUrl);
    const tokenData: any = await tokenResponse.json();
    console.log("🔑 Réponse Facebook access_token:", tokenData);

    if (!tokenData.access_token) {
      console.error("❌ Pas d'access_token Facebook:", tokenData);
      return res.status(400).json({ error: "Facebook login failed", details: tokenData });
    }

    const facebookAccessToken = tokenData.access_token;

    // 2️⃣ Récupérer le profil utilisateur Facebook
    const profileUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${facebookAccessToken}`;
    const profileResponse = await fetch(profileUrl);
    const profileData: any = await profileResponse.json();

    console.log("👤 Profil Facebook reçu:", profileData);

    // 3️⃣ Créer le token JWT interne
    const userPayload = {
      id: profileData.id,
      name: profileData.name,
      email: profileData.email ?? "unknown@facebook.com",
      photo: profileData.picture?.data?.url ?? null,
    };

    const token = jwt.sign({ user: userPayload }, SESSION_SECRET!, { expiresIn: "7d" });

    // 4️⃣ Construire l’URL de redirection mobile
    const redirectUrl = `${MOBILE_REDIRECT_URI}?token=${token}&fb_token=${facebookAccessToken}`;
    console.log("🔁 Redirection vers:", redirectUrl);

    // 🔚 Rediriger l’utilisateur vers l’app mobile (via le schéma `dreamreal://`)
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("❌ Erreur dans facebookCallback:", error);
    return res.status(500).json({ error: "Erreur interne OAuth Facebook" });
  }
}
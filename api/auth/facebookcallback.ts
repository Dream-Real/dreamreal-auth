import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL!;
const SESSION_SECRET = process.env.SESSION_SECRET!;
const MOBILE_REDIRECT_URI = process.env.MOBILE_REDIRECT_URI || "dreamreal://auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { code } = req.query;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ message: "Missing authorization code" });
    }

    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_CALLBACK_URL}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`;
    console.log("🔄 Récupération access_token depuis:", tokenUrl);

    const tokenResponse = await fetch(tokenUrl);
    const tokenData: any = await tokenResponse.json();
    console.log("🔑 Réponse Facebook access_token:", tokenData);

    if (!tokenData.access_token) {
      return res.status(400).json({ error: "Facebook login failed", details: tokenData });
    }

    const facebookAccessToken = tokenData.access_token;

    const profileUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${facebookAccessToken}`;
    console.log("📸 Appel Graph API →", profileUrl);

    const profileResponse = await fetch(profileUrl);
    const profileData: any = await profileResponse.json();

    console.log("👤 Profil Facebook reçu:", profileData);

    const userPayload = {
      id: profileData.id,
      name: profileData.name,
      email: profileData.email ?? "unknown@facebook.com",
      photo: profileData.picture?.data?.url ?? null,
    };

    const token = jwt.sign({ user: userPayload }, SESSION_SECRET, { expiresIn: "7d" });

    const redirectUrl = `${MOBILE_REDIRECT_URI}?token=${token}&facebook_access_token=${facebookAccessToken}`;
    console.log("🔁 Redirection vers:", redirectUrl);

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("❌ Erreur dans facebookCallback:", error);
    return res.status(500).json({ message: "Erreur interne OAuth Facebook", error });
  }
}
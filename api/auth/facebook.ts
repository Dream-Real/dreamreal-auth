import type { VercelRequest, VercelResponse } from "@vercel/node";
import dotenv from "dotenv";

dotenv.config();

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL!;

/**
 * 🌐 Étape 1 — Redirection vers la page de connexion Facebook
 */
export default async function facebookLogin(req: VercelRequest, res: VercelResponse) {
  try {
    const redirectUri = encodeURIComponent(FACEBOOK_CALLBACK_URL);
    const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${redirectUri}&response_type=code&scope=email,public_profile`;

    console.log("🌐 Redirection vers Facebook Login:", fbAuthUrl);
    console.log("↩️ CALLBACK attendu:", FACEBOOK_CALLBACK_URL);

    // ✅ Redirection vers Facebook OAuth
    return res.redirect(fbAuthUrl);
  } catch (error) {
    console.error("❌ Erreur facebookLogin:", error);
    return res.status(500).json({ error: "Erreur interne Facebook login", details: (error as Error).message });
  }
}
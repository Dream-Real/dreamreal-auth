import { VercelRequest, VercelResponse } from "@vercel/node";
import dotenv from "dotenv";

dotenv.config();

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL!;

export default async function facebookLogin(req: VercelRequest, res: VercelResponse) {
  try {
    const redirectUri = encodeURIComponent(FACEBOOK_CALLBACK_URL);
    const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${redirectUri}&response_type=code&scope=email,public_profile`;

    console.log("🌐 Redirection vers Facebook:", fbAuthUrl);
    return res.redirect(fbAuthUrl);
  } catch (err) {
    console.error("❌ Erreur facebookLogin:", err);
    return res.status(500).json({ error: "Erreur interne Facebook login" });
  }
}

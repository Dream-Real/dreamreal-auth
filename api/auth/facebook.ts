import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
    const FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL!;

    const redirectUri = encodeURIComponent(FACEBOOK_CALLBACK_URL);
    const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${redirectUri}&response_type=code&scope=email,public_profile`;

    console.log("🌐 Redirecting to Facebook OAuth:", fbAuthUrl);
    return res.redirect(fbAuthUrl);
  } catch (err) {
    console.error("❌ Facebook Login Error:", err);
    return res.status(500).json({ error: "Internal Facebook login error" });
  }
}
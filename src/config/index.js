import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'whatsapp-verify-token',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
  },

  instagram: {
    token: process.env.INSTAGRAM_TOKEN,
    appSecret: process.env.INSTAGRAM_APP_SECRET,
    verifyToken: process.env.INSTAGRAM_VERIFY_TOKEN || 'instagram-verify-token',
  },

  telegram: {
    token: process.env.TELEGRAM_TOKEN,
  },

  messenger: {
    token: process.env.MESSENGER_TOKEN,
    appSecret: process.env.MESSENGER_APP_SECRET,
    verifyToken: process.env.MESSENGER_VERIFY_TOKEN || 'messenger-verify-token',
  },

  salla: {
    webhookSecret: process.env.SALLA_WEBHOOK_SECRET,
    apiKey: process.env.SALLA_API_KEY,
    storeUrl: process.env.SALLA_STORE_URL,
  },
};

const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
for (const v of requiredVars) {
  if (!process.env[v]) {
    console.warn(`⚠️  Missing required environment variable: ${v}`);
  }
}

export default config;

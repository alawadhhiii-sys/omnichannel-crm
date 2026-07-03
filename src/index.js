import app from './app.js';
import config from './config/index.js';

const server = app.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════╗
║     Omnichannel CRM Server              ║
║──────────────────────────────────────────║
║  Port:        ${String(config.port).padEnd(30)}║
║  Environment: ${config.nodeEnv.padEnd(30)}║
║  Supabase:    ${config.supabase.url ? '✅ Connected' : '❌ Not Configured'.padEnd(21)}║
║  WhatsApp:    ${config.whatsapp.token ? '✅ Configured' : '❌ Not Configured'.padEnd(21)}║
║  Instagram:   ${config.instagram.token ? '✅ Configured' : '❌ Not Configured'.padEnd(21)}║
║  Telegram:    ${config.telegram.token ? '✅ Configured' : '❌ Not Configured'.padEnd(21)}║
║  Messenger:   ${config.messenger.token ? '✅ Configured' : '❌ Not Configured'.padEnd(21)}║
║  Salla:       ${config.salla.apiKey ? '✅ Configured' : '❌ Not Configured'.padEnd(21)}║
╚══════════════════════════════════════════╝`);
});

export default server;

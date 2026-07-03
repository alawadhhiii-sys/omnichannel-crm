import { Router } from 'express';
import whatsappWebhook from './webhooks/whatsapp.js';
import instagramWebhook from './webhooks/instagram.js';
import telegramWebhook from './webhooks/telegram.js';
import messengerWebhook from './webhooks/messenger.js';
import sallaRoutes from './salla.js';

const router = Router();

router.use('/webhooks/whatsapp', whatsappWebhook);
router.use('/webhooks/instagram', instagramWebhook);
router.use('/webhooks/telegram', telegramWebhook);
router.use('/webhooks/messenger', messengerWebhook);
router.use('/salla', sallaRoutes);

export default router;

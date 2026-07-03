import { Router } from 'express';
import config from '../../config/index.js';
import { handleIncomingMessage } from '../../services/messageService.js';
import { PLATFORMS } from '../../utils/constants.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const update = req.body;
    const message = update?.message || update?.callback_query?.message;

    if (!message) return res.status(200).json({ received: true });

    const from = message.from;
    const chatId = String(message.chat?.id || from?.id);
    const name = `${from?.first_name || ''} ${from?.last_name || ''}`.trim() || chatId;
    const text = message.text || message.caption || '';
    const messageType = message.text ? 'text' : (message.caption ? 'text' : 'unknown');

    let mediaUrl = null;
    if (message.photo) mediaUrl = message.photo[message.photo.length - 1]?.file_id;
    else if (message.document) mediaUrl = message.document.file_id;
    else if (message.video) mediaUrl = message.video.file_id;
    else if (message.audio) mediaUrl = message.audio.file_id;
    else if (message.voice) mediaUrl = message.voice.file_id;

    await handleIncomingMessage({
      platform: PLATFORMS.TELEGRAM,
      platformId: chatId,
      name,
      messageType,
      content: text,
      mediaUrl,
      metadata: {
        messageId: message.message_id,
        chatId: message.chat?.id,
        updateId: update.update_id,
      },
    });

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Telegram Webhook Error]', error.message);
    res.status(200).json({ received: true });
  }
});

router.get('/set-webhook', async (req, res) => {
  try {
    const webhookUrl = req.query.url;
    if (!webhookUrl) {
      return res.status(400).json({ error: 'Missing url query param' });
    }

    const response = await fetch(
      `https://api.telegram.org/bot${config.telegram.token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

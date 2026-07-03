import { Router } from 'express';
import { validateInstagramWebhook } from '../../middleware/validateWebhook.js';
import { handleIncomingMessage } from '../../services/messageService.js';
import { PLATFORMS } from '../../utils/constants.js';

const router = Router();

router.get('/', validateInstagramWebhook);
router.post('/', validateInstagramWebhook, async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) return res.status(200).json({ received: true });

    const messages = value.messages || [];

    for (const msg of messages) {
      const from = msg.from?.id || msg.from;
      const name = msg.from?.name || from;
      const messageType = msg.type || 'text';
      let content = '';
      let mediaUrl = null;

      if (messageType === 'text') {
        content = msg.text?.body || '';
      } else if (msg[messageType]) {
        content = msg[messageType]?.text || '';
        mediaUrl = msg[messageType]?.url || null;
      }

      await handleIncomingMessage({
        platform: PLATFORMS.INSTAGRAM,
        platformId: from,
        name,
        messageType,
        content,
        mediaUrl,
        metadata: { messageId: msg.id, timestamp: msg.timestamp },
      });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Instagram Webhook Error]', error.message);
    res.status(200).json({ received: true });
  }
});

export default router;

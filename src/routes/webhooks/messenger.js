import { Router } from 'express';
import { validateMessengerWebhook } from '../../middleware/validateWebhook.js';
import { handleIncomingMessage } from '../../services/messageService.js';
import { PLATFORMS } from '../../utils/constants.js';

const router = Router();

router.get('/', validateMessengerWebhook);
router.post('/', validateMessengerWebhook, async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const messaging = entry?.messaging?.[0];

    if (!messaging) return res.status(200).json({ received: true });

    const senderId = messaging.sender?.id;
    const recipientId = messaging.recipient?.id;
    const message = messaging.message;

    if (!senderId || !message) {
      return res.status(200).json({ received: true });
    }

    const text = message.text || '';
    const messageType = message.attachments?.[0]?.type || 'text';
    let mediaUrl = null;

    if (message.attachments) {
      mediaUrl = message.attachments[0]?.payload?.url || null;
    }

    await handleIncomingMessage({
      platform: PLATFORMS.MESSENGER,
      platformId: senderId,
      name: senderId,
      messageType,
      content: text,
      mediaUrl,
      metadata: {
        messageId: message.mid,
        recipientId,
        isEcho: message.is_echo || false,
      },
    });

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Messenger Webhook Error]', error.message);
    res.status(200).json({ received: true });
  }
});

export default router;

import { Router } from 'express';
import { validateWhatsAppWebhook } from '../../middleware/validateWebhook.js';
import { handleIncomingMessage } from '../../services/messageService.js';
import { unsubscribeCustomer } from '../../services/customerService.js';
import { isOptOutMessage } from '../../utils/optOutFilter.js';
import { PLATFORMS } from '../../utils/constants.js';

const router = Router();

router.get('/', validateWhatsAppWebhook);
router.post('/', validateWhatsAppWebhook, async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) {
      return res.status(200).json({ received: true });
    }

    const messages = value.messages || [];
    const contacts = value.contacts || [];

    for (const msg of messages) {
      const from = msg.from;
      const contact = contacts.find((c) => c.wa_id === from);

      const name = contact?.profile?.name || from;
      const messageType = msg.type || 'text';
      let content = '';
      let mediaUrl = null;

      if (messageType === 'text') {
        content = msg.text?.body || '';
      } else if (msg[messageType]) {
        content = msg[messageType]?.body || msg[messageType]?.caption || '';
        mediaUrl = msg[messageType]?.media?.link || null;
      }

      const { customer } = await handleIncomingMessage({
        platform: PLATFORMS.WHATSAPP,
        platformId: from,
        name,
        messageType,
        content,
        mediaUrl,
        metadata: { messageId: msg.id, timestamp: msg.timestamp },
      });

      if (isOptOutMessage(content)) {
        await unsubscribeCustomer(PLATFORMS.WHATSAPP, from);
        console.log(`[Opt-Out] ${from} unsubscribed via WhatsApp`);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[WhatsApp Webhook Error]', error.message);
    res.status(200).json({ received: true });
  }
});

export default router;

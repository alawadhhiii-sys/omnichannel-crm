import config from '../config/index.js';
import { getSubscribedCustomers } from './customerService.js';
import { saveMessage, findOrCreateChat } from './messageService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function sendWhatsAppMessage(to, messageData) {
  const url = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    ...messageData,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.whatsapp.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new AppError(`WhatsApp API error: ${err}`, response.status);
  }

  return response.json();
}

export async function broadcastToSubscribers({ messageData, platform = 'whatsapp' }) {
  const subscribers = await getSubscribedCustomers();

  const filtered = subscribers.filter((c) => c.platform === platform);

  console.log(`[Broadcast] Sending to ${filtered.length} subscribers on ${platform}`);

  const results = { sent: 0, failed: 0, errors: [] };

  for (const customer of filtered) {
    try {
      const result = await sendWhatsAppMessage(customer.platform_id, messageData);
      results.sent++;

      const chat = await findOrCreateChat(customer.id, platform);
      await saveMessage({
        chatId: chat.id,
        customerId: customer.id,
        platform,
        direction: 'outbound',
        content: typeof messageData.text?.body === 'string' ? messageData.text.body : JSON.stringify(messageData),
        metadata: { broadcastId: result.messages?.[0]?.id, type: 'broadcast' },
      });
    } catch (err) {
      results.failed++;
      results.errors.push({ customerId: customer.id, error: err.message });
    }
  }

  console.log(`[Broadcast] Done: ${results.sent} sent, ${results.failed} failed`);
  return results;
}

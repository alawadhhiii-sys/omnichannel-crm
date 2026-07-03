import axios from 'axios';
import config from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { SALLA_EVENTS } from '../utils/constants.js';

export async function handleSallaEvent(event, payload) {
  console.log(`[Salla] Event received: ${event}`);

  switch (event) {
    case SALLA_EVENTS.ABANDONED_CART:
      return handleAbandonedCart(payload);
    case SALLA_EVENTS.ORDER_CREATED:
      return handleOrderCreated(payload);
    case SALLA_EVENTS.ORDER_STATUS_UPDATED:
      return handleOrderStatusUpdated(payload);
    default:
      console.log(`[Salla] Unhandled event: ${event}`);
      return { ignored: true, event };
  }
}

async function handleAbandonedCart(payload) {
  const customerData = payload.data?.customer || {};
  const phone = customerData.mobile || customerData.phone;
  const name = customerData.first_name || customerData.name || 'عميل';

  if (!phone) {
    console.warn('[Salla] Abandoned cart: no phone number');
    return { skipped: true, reason: 'no phone' };
  }

  const platformId = phone.startsWith('966') ? phone : `966${phone.replace(/^0+/, '')}`;

  const { findOrCreateCustomer, getCustomerById } = await import('./customerService.js');
  const { findOrCreateChat, saveMessage } = await import('./messageService.js');
  const { sendWhatsAppMessage } = await import('./broadcastEngine.js');

  const customer = await findOrCreateCustomer({
    platform: 'whatsapp',
    platformId,
    name,
    metadata: { source: 'salla_abandoned_cart', cartId: payload.data?.id },
  });

  if (!customer.is_subscribed) {
    console.log(`[Salla] Customer ${platformId} unsubscribed, skipping`);
    return { skipped: true, reason: 'unsubscribed' };
  }

  const discountCode = generateCoupon();
  const cartUrl = payload.data?.url || `${config.salla.storeUrl}/cart`;

  const messageContent = {
    type: 'text',
    text: {
      preview_url: true,
      body: `مرحباً ${name} 🛒\n\nلاحظنا أنك تركت سلة التسوق! استخدم كود الخصم: *${discountCode}*\n\nاضغط هنا لإكمال الطلب: ${cartUrl}`,
    },
  };

  const apiResult = await sendWhatsAppMessage(platformId, messageContent);

  const chat = await findOrCreateChat(customer.id, 'whatsapp');

  await saveMessage({
    chatId: chat.id,
    customerId: customer.id,
    platform: 'whatsapp',
    direction: 'outbound',
    messageType: 'text',
    content: `مرحباً ${name} 🛒\n\nلاحظنا أنك تركت سلة التسوق! استخدم كود الخصم: ${discountCode}\n\nاضغط هنا لإكمال الطلب: ${cartUrl}`,
    metadata: { sallaEvent: SALLA_EVENTS.ABANDONED_CART, cartId: payload.data?.id, discountCode },
  });

  console.log(`[Salla] Abandoned cart recovery sent to ${platformId} with code ${discountCode}`);
  return { sent: true, customer: platformId, discountCode };
}

async function handleOrderCreated(payload) {
  console.log('[Salla] Order created:', payload.data?.id);
  return { event: SALLA_EVENTS.ORDER_CREATED, orderId: payload.data?.id };
}

async function handleOrderStatusUpdated(payload) {
  console.log('[Salla] Order status updated:', payload.data?.id, '->', payload.data?.status);
  return { event: SALLA_EVENTS.ORDER_STATUS_UPDATED, orderId: payload.data?.id, status: payload.data?.status };
}

function generateCoupon(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'WELCOME';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getSallaOrders() {
  if (!config.salla.apiKey) {
    throw new AppError('Salla API key not configured', 400);
  }

  const response = await axios.get(`${config.salla.storeUrl}/api/v2/orders`, {
    headers: {
      Authorization: `Bearer ${config.salla.apiKey}`,
    },
  });

  return response.data;
}

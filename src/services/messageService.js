import { requireSupabaseAdmin } from '../db/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { MESSAGE_DIRECTIONS, MESSAGE_TYPES } from '../utils/constants.js';

export async function findOrCreateChat(customerId, platform) {
  const supabase = requireSupabaseAdmin();

  const { data: existing } = await supabase
    .from('chats')
    .select('*')
    .eq('customer_id', customerId)
    .eq('platform', platform)
    .eq('status', 'active')
    .maybeSingle();

  if (existing) return existing;

  const { data: chat, error } = await supabase
    .from('chats')
    .insert({
      customer_id: customerId,
      platform,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw new AppError(`Failed to create chat: ${error.message}`, 500);
  return chat;
}

export async function saveMessage({
  chatId,
  customerId,
  platform,
  direction,
  messageType = MESSAGE_TYPES.TEXT,
  content,
  mediaUrl,
  metadata,
}) {
  const supabase = requireSupabaseAdmin();

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      customer_id: customerId,
      platform,
      direction,
      message_type: messageType,
      content,
      media_url: mediaUrl,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) throw new AppError(`Failed to save message: ${error.message}`, 500);
  return message;
}

export async function handleIncomingMessage({
  platform,
  platformId,
  name,
  direction = MESSAGE_DIRECTIONS.INBOUND,
  messageType = MESSAGE_TYPES.TEXT,
  content,
  mediaUrl,
  metadata,
}) {
  const { findOrCreateCustomer } = await import('./customerService.js');

  const customer = await findOrCreateCustomer({
    platform,
    platformId,
    name,
    metadata,
  });

  const chat = await findOrCreateChat(customer.id, platform);

  const message = await saveMessage({
    chatId: chat.id,
    customerId: customer.id,
    platform,
    direction,
    messageType,
    content,
    mediaUrl,
    metadata,
  });

  return { customer, chat, message };
}

export async function getChatMessages(chatId, limit = 50) {
  const supabase = requireSupabaseAdmin();

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new AppError(`Failed to fetch messages: ${error.message}`, 500);
  return data || [];
}

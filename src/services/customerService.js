import { requireSupabaseAdmin } from '../db/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

export async function findOrCreateCustomer({ platform, platformId, name, metadata }) {
  const supabase = requireSupabaseAdmin();

  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('platform', platform)
    .eq('platform_id', platformId)
    .maybeSingle();

  if (existing) {
    if (name && name !== existing.name) {
      const { data: updated } = await supabase
        .from('customers')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();

      return updated;
    }
    return existing;
  }

  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      platform,
      platform_id: platformId,
      name: name || 'Unknown',
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) throw new AppError(`Failed to create customer: ${error.message}`, 500);
  return newCustomer;
}

export async function unsubscribeCustomer(platform, platformId) {
  const supabase = requireSupabaseAdmin();

  const { data, error } = await supabase
    .from('customers')
    .update({ is_subscribed: false, updated_at: new Date().toISOString() })
    .eq('platform', platform)
    .eq('platform_id', platformId)
    .select()
    .single();

  if (error) throw new AppError(`Failed to unsubscribe: ${error.message}`, 500);
  return data;
}

export async function getSubscribedCustomers() {
  const supabase = requireSupabaseAdmin();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('is_subscribed', true);

  if (error) throw new AppError(`Failed to fetch subscribers: ${error.message}`, 500);
  return data || [];
}

export async function getCustomerById(id) {
  const supabase = requireSupabaseAdmin();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new AppError(`Failed to fetch customer: ${error.message}`, 500);
  return data;
}

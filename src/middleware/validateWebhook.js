import crypto from 'crypto';
import config from '../config/index.js';

export function validateWhatsAppWebhook(req, res, next) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    console.log('WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }

  if (mode && token) {
    return res.status(403).json({ error: 'Verification failed' });
  }

  next();
}

export function validateInstagramWebhook(req, res, next) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.instagram.verifyToken) {
    console.log('Instagram webhook verified');
    return res.status(200).send(challenge);
  }

  if (mode && token) {
    return res.status(403).json({ error: 'Verification failed' });
  }

  next();
}

export function validateMessengerWebhook(req, res, next) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.messenger.verifyToken) {
    console.log('Messenger webhook verified');
    return res.status(200).send(challenge);
  }

  if (mode && token) {
    return res.status(403).json({ error: 'Verification failed' });
  }

  next();
}

export function validateSallaWebhook(req, res, next) {
  const signature = req.headers['x-salla-webhook-signature'];
  const secret = config.salla.webhookSecret;

  if (!secret) {
    console.warn('Salla webhook secret not configured, skipping validation');
    return next();
  }

  if (!signature) {
    return res.status(401).json({ error: 'Missing signature header' });
  }

  const payload = JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (signature !== expected) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
}

import { Router } from 'express';
import { validateSallaWebhook } from '../middleware/validateWebhook.js';
import { handleSallaEvent } from '../services/sallaService.js';

const router = Router();

router.post('/webhook', validateSallaWebhook, async (req, res) => {
  try {
    const event = req.body?.event;
    const payload = req.body;

    if (!event) {
      return res.status(400).json({ error: 'Missing event type' });
    }

    const result = await handleSallaEvent(event, payload);

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[Salla Webhook Error]', error.message);
    res.status(200).json({ success: false, error: error.message });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const { getSallaOrders } = await import('../services/sallaService.js');
    const orders = await getSallaOrders();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

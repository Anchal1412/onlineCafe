const Razorpay = require('razorpay');
const crypto = require('crypto');
const PaymentModel = require('../models/paymentModel');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpay = keyId && keySecret ? new Razorpay({ key_id: keyId, key_secret: keySecret }) : null;

async function createOrder(req, res) {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;
    if (!amount || amount <= 0) return res.status(400).send({ error: 'Invalid amount' });

    if (razorpay) {
      const options = {
        amount: Math.round(amount * 100),
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        payment_capture: 1,
        notes: notes || {}
      };
      const order = await razorpay.orders.create(options);
      await PaymentModel.create({ id: order.id, amount, currency, status: order.status || 'created', raw: order });
      return res.send({ orderId: order.id, amount: order.amount, currency: order.currency, key: keyId, order });
    } else {
      // Mock order
      const id = `mock_order_${Date.now()}`;
      const order = { id, amount: Math.round(amount * 100), currency, status: 'created' };
      await PaymentModel.create({ id, amount, currency, status: 'created', raw: order });
      return res.send({ orderId: id, amount: order.amount, currency: order.currency, key: 'mock_key', order });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'internal_error' });
  }
}

async function getPayment(req, res) {
  try {
    const { id } = req.params;
    const p = await PaymentModel.get(id);
    if (!p) return res.status(404).send({ error: 'not_found' });
    res.send(p);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'internal_error' });
  }
}

// Webhook handler for Razorpay (expects raw body)
async function handleWebhook(req, res) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  try {
    const raw = req.body; // express.raw() provides a Buffer

    if (webhookSecret) {
      if (!signature) {
        console.error('Missing webhook signature');
        return res.status(400).send('missing signature');
      }

      const expected = crypto.createHmac('sha256', webhookSecret).update(raw).digest('hex');
      const sigBuf = Buffer.from(signature, 'utf8');
      const expBuf = Buffer.from(expected, 'utf8');

      let signatureValid = false;
      if (sigBuf.length === expBuf.length) {
        signatureValid = crypto.timingSafeEqual(sigBuf, expBuf);
      }

      if (!signatureValid) {
        console.error('Invalid webhook signature');
        return res.status(400).send('invalid signature');
      }
    }

    const event = JSON.parse(raw.toString());
    const evtName = event.event || event.payload?.event || 'unknown';

    // Handle relevant events
    if (evtName === 'payment.captured') {
      const payment = event.payload.payment.entity;
      await PaymentModel.update(payment.order_id, { status: 'captured', raw: payment });
      return res.json({ received: true, event: evtName });
    }

    if (evtName === 'payment.failed') {
      const payment = event.payload.payment.entity;
      await PaymentModel.update(payment.order_id, { status: 'failed', raw: payment });
      return res.json({ received: true, event: evtName });
    }

    if (evtName === 'order.paid') {
      const order = event.payload.order.entity;
      await PaymentModel.update(order.id, { status: 'paid', raw: order });
      return res.json({ received: true, event: evtName });
    }

    // Unknown events — acknowledge quickly to avoid retries
    return res.json({ received: true, event: evtName });
  } catch (err) {
    console.error('Webhook handling error', err);
    return res.status(500).send('webhook_error');
  }
}

module.exports = { createOrder, getPayment, handleWebhook };

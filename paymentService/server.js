const path = require('path');
const fs = require('fs');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());

// Stripe requires the webhook route to receive the raw body. We'll mount
// the webhook route before the JSON body parser.
const { handleWebhook } = require('./controllers/paymentController');
app.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// parse JSON for regular routes
app.use(express.json());

// Attach payment routes
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);
app.post('/api/payments/test', (req, res) => {
  console.log('✅ test route hit');
  res.json({ test: 'working' });
});


// simple health
app.get('/', (req, res) => res.send({ service: 'paymentService', status: 'ok' }));

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => console.log(`Payment Service running on port ${PORT}`));
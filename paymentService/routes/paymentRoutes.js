const express = require('express');
console.log('⚡ paymentRoutes loaded');

const router = express.Router();
const { createOrder, getPayment } = require('../controllers/paymentController');

// Create a Razorpay order. Alias kept for compatibility.
router.post('/create-order', createOrder);
router.post('/create-intent', createOrder);
router.get('/:id', getPayment);

module.exports = router;

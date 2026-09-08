import dotenv from 'dotenv';
dotenv.config();

import { Cashfree, CFEnvironment } from 'cashfree-pg';

async function testPaymentBackend() {
  console.log('--- Testing Rebuilt Cashfree Backend Integration ---');
  
  const env = CFEnvironment.SANDBOX;
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  
  if (!appId || !secretKey) {
    throw new Error('CASHFREE_APP_ID or CASHFREE_SECRET_KEY is missing');
  }

  console.log('App ID:', appId);
  console.log('Environment: Sandbox');
  
  const cashfree = new Cashfree(env, appId, secretKey);
  cashfree.XApiVersion = "2025-01-01";

  const orderId = `test_order_${Date.now()}`;
  const request = {
    order_amount: 5000,
    order_currency: "INR",
    order_id: orderId,
    customer_details: {
      customer_id: "test_customer_pj",
      customer_phone: "9876543210",
      customer_email: "test@pjlawn.com",
      customer_name: "Test Customer"
    },
    order_meta: {
      return_url: "https://pjlawn.netlify.app/dashboard?order_id={order_id}",
      notify_url: "https://pjlawn.netlify.app/.netlify/functions/cashfree-webhook"
    },
    order_note: "PJ Lawn Advance Test Order"
  };

  console.log(`\n1. Creating test order: ${orderId}...`);
  const createRes = await cashfree.PGCreateOrder(request);
  console.log('✓ Order created successfully!');
  console.log('  Payment Session ID:', createRes.data.payment_session_id?.substring(0, 30) + '...');
  console.log('  Order Status:', createRes.data.order_status);

  console.log(`\n2. Fetching order status via PGFetchOrder(${orderId})...`);
  const fetchRes = await cashfree.PGFetchOrder(orderId);
  console.log('✓ Order fetched successfully!');
  console.log('  Status:', fetchRes.data.order_status);
  console.log('  Amount:', fetchRes.data.order_amount, fetchRes.data.order_currency);

  console.log(`\n3. Fetching payments via PGOrderFetchPayments(${orderId})...`);
  const paymentsRes = await cashfree.PGOrderFetchPayments(orderId);
  console.log('✓ PGOrderFetchPayments executed with correct SDK v6 signature!');
  console.log('  Payments count:', Array.isArray(paymentsRes.data) ? paymentsRes.data.length : 0);

  console.log('\n✓ Cashfree Payment Engine is fully functional in Sandbox!');
}

testPaymentBackend().catch(err => {
  console.error('Test failed:', err.response?.data || err.message);
  process.exit(1);
});

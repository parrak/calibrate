const crypto = require('crypto');

// Helper to create Stripe-style HMAC signature with timestamp
function createHmacSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

// Test payload
const payload = {
  idempotencyKey: `test-${Date.now()}`,
  skuCode: 'PRO-MONTHLY',
  proposedAmount: 5200, // $52.00 (from $49.00, +6% increase)
  currency: 'USD',
  source: 'MANUAL', // Must be: AI, RULE, MANUAL, or CONNECTOR
  context: {
    reason: 'Testing webhook integration',
    testRun: true,
  },
};

const payloadString = JSON.stringify(payload);
const secret = 'whsec_dev_calibrate_2024';
const signature = createHmacSignature(payloadString, secret);

console.log('📤 Sending price suggestion webhook...\n');
console.log('Payload:', JSON.stringify(payload, null, 2));
console.log('\nSignature:', signature);
console.log('\n---\n');

// Send the webhook
fetch('http://localhost:3000/api/v1/webhooks/price-suggestion', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-calibr-signature': signature,
    'x-calibr-project': 'demo',
  },
  body: payloadString,
})
  .then((res) => res.json())
  .then((data) => {
    console.log('✅ Response:', JSON.stringify(data, null, 2));

    if (data.id) {
      console.log('\n🎉 Success! Price change created with ID:', data.id);
      console.log('Status:', data.status);
      console.log('Policy result:', data.policyResult?.ok ? '✅ Passed' : '❌ Failed');

      if (data.policyResult?.checks) {
        console.log('\nPolicy Checks:');
        data.policyResult.checks.forEach((check) => {
          const icon = check.ok ? '✅' : '❌';
          console.log(`  ${icon} ${check.name}`);
        });
      }
    }
  })
  .catch((err) => {
    console.error('❌ Error:', err.message);
  });

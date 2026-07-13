const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost', port: 3000, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };
    const req = http.request(options, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  const tests = [
    { name: 'OTP Email',        path: '/send-otp',                body: { email: 'zraw1404@gmail.com', otp: '654321' } },
    { name: 'Welcome Email',    path: '/send-welcome',            body: { email: 'zraw1404@gmail.com', name: 'Aditya Kumar' } },
    { name: 'Forgot Password',  path: '/send-forgot-password',   body: { email: 'zraw1404@gmail.com', name: 'Aditya Kumar', otp: '987654' } },
    { name: 'Order Confirmation', path: '/send-order-confirmation', body: {
        order: {
          orderId: 'QC-TEST-001', userName: 'Aditya Kumar', userEmail: 'zraw1404@gmail.com',
          createdAt: new Date().toISOString(), paymentMethod: 'UPI', address: 'Flat 402, Vashi, Navi Mumbai - 400703',
          items: [{ name: 'SuperBass Headphones', price: 4999, quantity: 1 }, { name: 'Organic Honey', price: 799, quantity: 2 }],
          subtotal: 6597, deliveryCharge: 0, discount: 200, totalAmount: 6397,
        }
    }},
    { name: 'Order Status: Dispatched', path: '/send-order-status', body: {
        order: { orderId: 'QC-TEST-001', userName: 'Aditya Kumar', userEmail: 'zraw1404@gmail.com' },
        status: 'Dispatched'
    }},
    { name: 'Order Status: Delivered', path: '/send-order-status', body: {
        order: { orderId: 'QC-TEST-001', userName: 'Aditya Kumar', userEmail: 'zraw1404@gmail.com' },
        status: 'Delivered'
    }},
    { name: 'Cart Reminder', path: '/send-cart-reminder', body: {
        email: 'zraw1404@gmail.com', name: 'Aditya Kumar',
        items: [{ name: 'SuperBass Headphones', price: 4999 }, { name: 'Organic Honey', price: 799 }]
    }},
  ];

  console.log('\n🧪 quickCart Email System Test Suite\n' + '═'.repeat(50));
  let passed = 0;
  for (const test of tests) {
    try {
      const res = await post(test.path, test.body);
      const ok = res.status === 200;
      console.log(`${ok ? '✅' : '❌'} [${res.status}] ${test.name}`);
      if (ok) passed++;
      await new Promise(r => setTimeout(r, 800)); // small delay between sends
    } catch (err) {
      console.log(`❌ ${test.name}: ${err.message}`);
    }
  }
  console.log(`\n${'─'.repeat(50)}\nResults: ${passed}/${tests.length} passed\n`);
}

runTests();

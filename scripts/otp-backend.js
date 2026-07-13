/**
 * quickCart Local OTP & Email Notification Backend
 * Mirrors all Firebase Cloud Functions for local development.
 * Run: node scripts/otp-backend.js (or npm run otp-backend)
 * Requires .env.otp in project root with GMAIL_USER and GMAIL_PASS
 */

const http = require('http');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// ─── Load credentials ──────────────────────────────────────────────────────
let GMAIL_USER = 'quicckcart@gmail.com';
let GMAIL_PASS = '';

try {
  const envPath = path.join(__dirname, '../.env.otp');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim();
      if (key === 'GMAIL_USER') GMAIL_USER = val;
      if (key === 'GMAIL_PASS') GMAIL_PASS = val;
    }
  }
} catch (e) {
  console.error('Could not read .env.otp:', e.message);
}

function createTransporter() {
  return nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_PASS } });
}

async function sendMail(to, subject, html) {
  if (!GMAIL_PASS) { console.error('[OTP Server] GMAIL_PASS not set in .env.otp'); return false; }
  try {
    await createTransporter().sendMail({ from: `"quickCart" <${GMAIL_USER}>`, to, subject, html });
    console.log(`[OTP Server] ✅ Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error(`[OTP Server] ❌ Failed to send to ${to}:`, err.message);
    return false;
  }
}

// ─── Templates (mirrors Cloud Functions) ────────────────────────────────────
function baseTemplate(content) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
.header{background:linear-gradient(135deg,#4CAF50,#2e7d32);padding:28px 32px;text-align:center}
.logo{font-size:28px;font-weight:900;color:#fff;letter-spacing:1px}.logo span{color:#a5d6a7}
.body{padding:32px}.footer{background:#f8f8f8;padding:20px 32px;text-align:center;border-top:1px solid #eee}
.footer p{color:#999;font-size:12px;margin:4px 0}
.card{background:#f9fafb;border:1px solid #e8e8e8;border-radius:10px;padding:20px;margin:16px 0}
.badge{display:inline-block;background:#e8f5e9;color:#2e7d32;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:700}
h2{color:#222;margin-top:0}p{color:#555;line-height:1.7;font-size:15px}
table{width:100%;border-collapse:collapse}th{background:#f0f0f0;padding:10px;text-align:left;font-size:13px;color:#666}
td{padding:10px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333}
.total-row td{font-weight:700;color:#222;border-top:2px solid #ddd}
</style></head><body><div style="padding:24px 0"><div class="wrapper">
<div class="header"><div class="logo">quick<span>Cart</span></div><p style="color:#c8e6c9;margin:4px 0;font-size:13px">Your Smart Shopping Partner</p></div>
<div class="body">${content}</div>
<div class="footer"><p>Need help? <a href="mailto:support@quickcart.com" style="color:#4CAF50">support@quickcart.com</a></p>
<p>© 2026 quickCart. All rights reserved.</p></div>
</div></div></body></html>`;
}

function otpTemplate(otp) {
  return baseTemplate(`<h2>Your Verification Code</h2>
<p>Use this One-Time Password to complete your registration:</p>
<div style="font-size:36px;font-weight:900;background:#f0f4f0;padding:24px;text-align:center;border-radius:10px;letter-spacing:10px;color:#2e7d32;margin:24px 0">${otp}</div>
<p style="color:#888;font-size:13px">⏱ Valid for 5 minutes · One-time use only</p>`);
}

function welcomeTemplate(name) {
  return baseTemplate(`<h2>Welcome to quickCart, ${name}! 🎉</h2>
<p>Your account has been <strong>successfully created</strong>. We're thrilled to have you!</p>
<div class="card"><p style="margin:0;font-size:14px">✅ Account verified & ready<br>🛒 Browse thousands of products<br>🚀 Fast delivery to your doorstep</p></div>
<p>Happy Shopping,<br><strong>The quickCart Team</strong></p>`);
}

function forgotPasswordTemplate(name, otp) {
  return baseTemplate(`<h2>Password Reset Request</h2>
<p>Hi <strong>${name}</strong>, use this OTP to reset your password:</p>
<div style="font-size:36px;font-weight:900;background:#fff3e0;padding:24px;text-align:center;border-radius:10px;letter-spacing:10px;color:#e65100;margin:24px 0">${otp}</div>
<p style="color:#888;font-size:13px">⏱ Valid for 10 minutes · One-time use only</p>`);
}

function orderItemsRows(items) {
  return (items || []).map(i => `<tr><td>${i.name}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">₹${(i.price * i.quantity).toLocaleString('en-IN')}</td></tr>`).join('');
}

function orderConfirmationTemplate(order) {
  const estDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return baseTemplate(`<h2>Order Confirmed! 🎊</h2>
<p>Hi <strong>${order.userName}</strong>, your order has been successfully placed!</p>
<div class="card">
<p style="margin:4px 0"><strong>Order ID:</strong> <span style="color:#4CAF50">${order.orderId}</span></p>
<p style="margin:4px 0"><strong>Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleString('en-IN')}</p>
<p style="margin:4px 0"><strong>Payment:</strong> ${order.paymentMethod}</p>
<p style="margin:4px 0"><strong>Address:</strong> ${order.address}</p>
</div>
<table><thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Amount</th></tr></thead>
<tbody>${orderItemsRows(order.items)}</tbody></table>
<table style="margin-top:8px"><tbody>
<tr><td>Subtotal</td><td style="text-align:right">₹${(order.subtotal||0).toLocaleString('en-IN')}</td></tr>
<tr><td>Delivery</td><td style="text-align:right">₹${(order.deliveryCharge||0).toLocaleString('en-IN')}</td></tr>
${order.discount>0?`<tr><td style="color:#e53935">Discount</td><td style="text-align:right;color:#e53935">-₹${order.discount.toLocaleString('en-IN')}</td></tr>`:''}
<tr class="total-row"><td>Total Paid</td><td style="text-align:right">₹${(order.totalAmount||0).toLocaleString('en-IN')}</td></tr>
</tbody></table>
<div class="card" style="background:#e8f5e9;border-color:#a5d6a7"><p style="margin:0;color:#2e7d32">🚚 <strong>Est. Delivery:</strong> ${estDate}</p></div>`);
}

function orderStatusTemplate(order, emoji, title, message, extra) {
  return baseTemplate(`<h2>${emoji} ${title}</h2>
<p>Hi <strong>${order.userName || 'Customer'}</strong>, ${message}</p>
<div class="card">
<p style="margin:4px 0"><strong>Order ID:</strong> <span style="color:#4CAF50">${order.orderId}</span></p>
<p style="margin:4px 0"><strong>Status:</strong> <span class="badge">${order.status}</span></p>
${extra || ''}
</div>
<p>Thank you for shopping with quickCart!</p>`);
}

function deliveredTemplate(order) {
  return baseTemplate(`<h2>Delivered! 📦✅</h2>
<p>Hi <strong>${order.userName || 'Customer'}</strong>, your order has been successfully delivered!</p>
<div class="card">
<p style="margin:4px 0"><strong>Order ID:</strong> ${order.orderId}</p>
<p style="margin:0"><strong>Delivered On:</strong> ${new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
</div>
<p>Please rate your products in the quickCart app. Your feedback helps us improve!</p>
<p>Thank you for choosing quickCart. See you again soon! 🛒</p>`);
}

function cartReminderTemplate(name, items) {
  const rows = (items||[]).slice(0,3).map(i=>`<tr><td>${i.name}</td><td style="text-align:right">₹${i.price.toLocaleString('en-IN')}</td></tr>`).join('');
  return baseTemplate(`<h2>You left something behind! 🛒</h2>
<p>Hi <strong>${name}</strong>, you have items waiting in your quickCart:</p>
<table><thead><tr><th>Product</th><th style="text-align:right">Price</th></tr></thead><tbody>${rows}</tbody></table>
<p>Complete your purchase before items sell out!</p>`);
}

// ─── Route Handlers ───────────────────────────────────────────────────────────
const routes = {
  '/send-otp': async ({ email, otp }) => {
    if (!email || !otp) return [400, { error: 'email and otp required' }];
    const ok = await sendMail(email, 'quickCart – Your Verification Code', otpTemplate(otp));
    return ok ? [200, { success: true }] : [500, { error: 'Failed to send email' }];
  },
  '/send-welcome': async ({ email, name }) => {
    if (!email || !name) return [400, { error: 'email and name required' }];
    const ok = await sendMail(email, `Welcome to quickCart, ${name}! 🎉`, welcomeTemplate(name));
    return ok ? [200, { success: true }] : [500, { error: 'Failed to send email' }];
  },
  '/send-forgot-password': async ({ email, name, otp }) => {
    if (!email || !otp) return [400, { error: 'email and otp required' }];
    const ok = await sendMail(email, 'quickCart – Password Reset Code', forgotPasswordTemplate(name||'Customer', otp));
    return ok ? [200, { success: true }] : [500, { error: 'Failed to send email' }];
  },
  '/send-order-confirmation': async ({ order }) => {
    if (!order || !order.userEmail) return [400, { error: 'order data required' }];
    const ok = await sendMail(order.userEmail, `Order Confirmed – ${order.orderId} | quickCart`, orderConfirmationTemplate(order));
    return ok ? [200, { success: true }] : [500, { error: 'Failed to send email' }];
  },
  '/send-order-status': async ({ order, status }) => {
    if (!order || !order.userEmail || !status) return [400, { error: 'order and status required' }];
    const CONFIGS = {
      'Confirmed':        ['✅', 'Order Confirmed',       'your order has been confirmed!'],
      'Preparing':        ['👨‍🍳','Order Being Prepared', 'our team is preparing your order.'],
      'Packed':           ['📦', 'Order Packed',          'your order is packed and ready to ship.'],
      'Dispatched':       ['🚚', 'Order Dispatched',      'your order is on its way!', '<p style="margin:4px 0"><strong>Carrier:</strong> quickCart Logistics</p>'],
      'Out For Delivery': ['🏃', 'Out For Delivery',      'your order is almost there!', '<p style="margin:4px 0"><strong>Expected:</strong> Today by 8:00 PM</p>'],
      'Delivered':        null,
      'Cancelled':        ['❌', 'Order Cancelled',       'your order has been cancelled.', '<p style="margin:4px 0"><strong>Refund:</strong> 5–7 business days</p>'],
      'Refund Initiated': ['🔄', 'Refund Initiated',      'your refund is being processed.', '<p style="margin:4px 0"><strong>Timeline:</strong> 5–7 business days</p>'],
      'Refunded':         ['💰', 'Refund Completed',      'your refund has been successfully credited!'],
    };
    order.status = status;
    if (status === 'Delivered') {
      const ok = await sendMail(order.userEmail, `📦 Delivered – ${order.orderId} | quickCart`, deliveredTemplate(order));
      return ok ? [200, { success: true }] : [500, { error: 'Failed' }];
    }
    const cfg = CONFIGS[status];
    if (!cfg) return [400, { error: `Unknown status: ${status}` }];
    const ok = await sendMail(order.userEmail, `${cfg[0]} ${status} – ${order.orderId} | quickCart`, orderStatusTemplate(order, cfg[0], cfg[1], cfg[2], cfg[3]));
    return ok ? [200, { success: true }] : [500, { error: 'Failed' }];
  },
  '/send-cart-reminder': async ({ email, name, items }) => {
    if (!email || !name) return [400, { error: 'email and name required' }];
    const ok = await sendMail(email, '🛒 You left items in your quickCart!', cartReminderTemplate(name, items));
    return ok ? [200, { success: true }] : [500, { error: 'Failed to send email' }];
  },
};

// ─── HTTP Server ───────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '3600');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST') { res.writeHead(404); res.end(); return; }

  const handler = routes[req.url];
  if (!handler) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: `Unknown route: ${req.url}` })); return; }

  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', async () => {
    try {
      const parsed = JSON.parse(body);
      const [status, response] = await handler(parsed);
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (err) {
      console.error('[OTP Server] Handler error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('╔═════════════════════════════════════════════════╗');
  console.log('║      quickCart Email Notification Server        ║');
  console.log(`║  Listening on http://localhost:${PORT}               ║`);
  console.log(`║  From: ${GMAIL_USER}            ║`);
  console.log(`║  Pass: ${GMAIL_PASS ? '✓ Configured' : '✗ MISSING – add GMAIL_PASS to .env.otp'}  ║`);
  console.log('╠═════════════════════════════════════════════════╣');
  console.log('║  Routes:                                        ║');
  console.log('║  POST /send-otp                                 ║');
  console.log('║  POST /send-welcome                             ║');
  console.log('║  POST /send-forgot-password                     ║');
  console.log('║  POST /send-order-confirmation                  ║');
  console.log('║  POST /send-order-status                        ║');
  console.log('║  POST /send-cart-reminder                       ║');
  console.log('╚═════════════════════════════════════════════════╝');
  console.log('');
});

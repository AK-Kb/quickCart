const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();
const db = admin.firestore();

// ─── Gmail Credentials ───────────────────────────────────────────────────────
const GMAIL_USER = 'quicckcart@gmail.com';
function getGmailPass() {
  try { return functions.config().gmail.pass; } catch { return process.env.GMAIL_PASS || ''; }
}
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: getGmailPass() },
  });
}

// ─── Helper: Send Email with Retry ───────────────────────────────────────────
async function sendEmail(to, subject, html, retries = 2) {
  const transporter = createTransporter();
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await transporter.sendMail({ from: `"quickCart" <${GMAIL_USER}>`, to, subject, html });
      console.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (err) {
      console.error(`Email attempt ${attempt + 1} failed for ${to}:`, err.message);
      if (attempt === retries) return false;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return false;
}

// ─── Helper: Record Email Log in Firestore (prevents duplicates) ──────────────
async function recordEmailSent(docPath, emailType) {
  await db.doc(docPath).set(
    { [`emailSent_${emailType}`]: true, [`emailSentAt_${emailType}`]: new Date().toISOString() },
    { merge: true }
  );
}
async function wasEmailSent(docPath, emailType) {
  const snap = await db.doc(docPath).get();
  return snap.exists && snap.data()[`emailSent_${emailType}`] === true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

function baseTemplate(content) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>quickCart</title>
<style>
  body{margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif}
  .wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#4CAF50,#2e7d32);padding:28px 32px;text-align:center}
  .logo{font-size:28px;font-weight:900;color:#fff;letter-spacing:1px}
  .logo span{color:#a5d6a7}
  .body{padding:32px}
  .footer{background:#f8f8f8;padding:20px 32px;text-align:center;border-top:1px solid #eee}
  .footer p{color:#999;font-size:12px;margin:4px 0}
  .btn{display:inline-block;background:#4CAF50;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;margin:16px 0}
  .card{background:#f9fafb;border:1px solid #e8e8e8;border-radius:10px;padding:20px;margin:16px 0}
  .badge{display:inline-block;background:#e8f5e9;color:#2e7d32;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:700}
  h2{color:#222;margin-top:0}
  p{color:#555;line-height:1.7;font-size:15px}
  .divider{border:none;border-top:1px solid #eee;margin:20px 0}
  table{width:100%;border-collapse:collapse}
  th{background:#f0f0f0;padding:10px;text-align:left;font-size:13px;color:#666}
  td{padding:10px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333}
  .total-row td{font-weight:700;color:#222;border-top:2px solid #ddd}
  .status-pill{display:inline-block;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:700}
</style></head>
<body><div style="padding:24px 0">
<div class="wrapper">
  <div class="header"><div class="logo">quick<span>Cart</span></div><p style="color:#c8e6c9;margin:4px 0;font-size:13px">Your Smart Shopping Partner</p></div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>Need help? <a href="mailto:support@quickcart.com" style="color:#4CAF50">support@quickcart.com</a></p>
    <p>© 2026 quickCart. All rights reserved.</p>
    <p style="margin-top:10px;font-size:11px;color:#bbb">If you did not initiate this action, please ignore this email.</p>
  </div>
</div></div></body></html>`;
}

function orderItemsTable(items) {
  if (!items || items.length === 0) return '';
  const rows = items.map(item =>
    `<tr><td>${item.name || 'Product'}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td></tr>`
  ).join('');
  return `<table><thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// WELCOME EMAIL
function welcomeTemplate(name) {
  return baseTemplate(`
    <h2>Welcome to quickCart, ${name}! 🎉</h2>
    <p>Your account has been <strong>successfully created</strong>. We're thrilled to have you join the quickCart family!</p>
    <div class="card">
      <p style="margin:0;font-size:14px">✅ &nbsp;Account verified &amp; ready to use<br>🛒 &nbsp;Browse thousands of products<br>🚀 &nbsp;Fast delivery to your doorstep<br>💳 &nbsp;Safe &amp; secure checkout</p>
    </div>
    <p>Start exploring our latest collections and get the best deals!</p>
    <p>Happy Shopping,<br><strong>The quickCart Team</strong></p>
  `);
}

// OTP EMAIL
function otpTemplate(otp) {
  return baseTemplate(`
    <h2>Your Verification Code</h2>
    <p>Use the following One-Time Password (OTP) to complete your registration:</p>
    <div style="font-size:36px;font-weight:900;background:#f0f4f0;padding:24px;text-align:center;border-radius:10px;letter-spacing:10px;color:#2e7d32;margin:24px 0">${otp}</div>
    <p style="color:#888;font-size:13px">⏱ Valid for <strong>5 minutes</strong> · One-time use only</p>
  `);
}

// FORGOT PASSWORD EMAIL
function forgotPasswordTemplate(name, otp) {
  return baseTemplate(`
    <h2>Password Reset Request</h2>
    <p>Hi <strong>${name}</strong>, we received a request to reset your quickCart password.</p>
    <p>Use this OTP to reset your password:</p>
    <div style="font-size:36px;font-weight:900;background:#fff3e0;padding:24px;text-align:center;border-radius:10px;letter-spacing:10px;color:#e65100;margin:24px 0">${otp}</div>
    <p style="color:#888;font-size:13px">⏱ Valid for <strong>10 minutes</strong> · One-time use only</p>
    <p>If you did not request a password reset, please ignore this email. Your account remains secure.</p>
  `);
}

// ORDER CONFIRMATION EMAIL
function orderConfirmationTemplate(order) {
  const estDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return baseTemplate(`
    <h2>Order Confirmed! 🎊</h2>
    <p>Hi <strong>${order.userName}</strong>, thank you for your purchase! Your order has been successfully placed.</p>
    <div class="card">
      <p style="margin:0 0 8px;font-size:13px;color:#888">ORDER DETAILS</p>
      <p style="margin:4px 0"><strong>Order ID:</strong> <span style="color:#4CAF50">${order.orderId}</span></p>
      <p style="margin:4px 0"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN')}</p>
      <p style="margin:4px 0"><strong>Payment:</strong> ${order.paymentMethod}</p>
      <p style="margin:4px 0"><strong>Address:</strong> ${order.address}</p>
    </div>
    <p style="font-size:14px;font-weight:700;color:#444;margin-bottom:8px">Items Ordered</p>
    ${orderItemsTable(order.items)}
    <table style="margin-top:8px"><tbody>
      <tr><td>Subtotal</td><td style="text-align:right">₹${(order.subtotal || 0).toLocaleString('en-IN')}</td></tr>
      <tr><td>Delivery</td><td style="text-align:right">₹${(order.deliveryCharge || 0).toLocaleString('en-IN')}</td></tr>
      ${order.discount > 0 ? `<tr><td style="color:#e53935">Discount</td><td style="text-align:right;color:#e53935">- ₹${order.discount.toLocaleString('en-IN')}</td></tr>` : ''}
      <tr class="total-row"><td>Total Paid</td><td style="text-align:right">₹${(order.totalAmount || 0).toLocaleString('en-IN')}</td></tr>
    </tbody></table>
    <div class="card" style="background:#e8f5e9;border-color:#a5d6a7">
      <p style="margin:0;color:#2e7d32">🚚 <strong>Estimated Delivery:</strong> ${estDate}</p>
    </div>
    <p>We'll keep you updated on every step of your delivery!</p>
  `);
}

// ORDER STATUS EMAIL (reusable for all statuses)
function orderStatusTemplate(order, statusConfig) {
  return baseTemplate(`
    <h2>${statusConfig.emoji} ${statusConfig.title}</h2>
    <p>Hi <strong>${order.userName || 'Customer'}</strong>, ${statusConfig.message}</p>
    <div class="card">
      <p style="margin:0 0 4px"><strong>Order ID:</strong> <span style="color:#4CAF50">${order.orderId}</span></p>
      <p style="margin:0 0 4px"><strong>Status:</strong> <span class="badge">${order.status}</span></p>
      ${statusConfig.extra || ''}
    </div>
    ${statusConfig.itemsTable ? orderItemsTable(order.items) : ''}
    <p>${statusConfig.footer || 'Thank you for shopping with quickCart!'}</p>
  `);
}

// CART REMINDER EMAIL
function cartReminderTemplate(name, items) {
  const rows = (items || []).slice(0, 3).map(item =>
    `<tr><td>${item.name}</td><td style="text-align:right">₹${item.price.toLocaleString('en-IN')}</td></tr>`
  ).join('');
  return baseTemplate(`
    <h2>You left something behind! 🛒</h2>
    <p>Hi <strong>${name}</strong>, you have items waiting in your quickCart cart:</p>
    <table><thead><tr><th>Product</th><th style="text-align:right">Price</th></tr></thead><tbody>${rows}</tbody></table>
    <p>Complete your purchase before your items sell out!</p>
    <p>Happy Shopping,<br><strong>The quickCart Team</strong></p>
  `);
}

// REFUND EMAIL
function refundTemplate(order, isCompleted) {
  return baseTemplate(`
    <h2>${isCompleted ? 'Refund Completed ✅' : 'Refund Initiated 🔄'}</h2>
    <p>Hi <strong>${order.userName || 'Customer'}</strong>, ${isCompleted
      ? 'your refund has been successfully processed and will reflect in your account within 5–7 business days.'
      : 'your refund has been initiated and is being processed.'}</p>
    <div class="card">
      <p style="margin:0 0 4px"><strong>Order ID:</strong> ${order.orderId}</p>
      <p style="margin:0 0 4px"><strong>Refund Amount:</strong> ₹${(order.totalAmount || 0).toLocaleString('en-IN')}</p>
      <p style="margin:0"><strong>Status:</strong> ${isCompleted ? 'Completed' : 'In Progress'}</p>
    </div>
    <p>If you have any questions, contact our support team at <a href="mailto:support@quickcart.com">support@quickcart.com</a></p>
  `);
}

// DELIVERY CONFIRMATION WITH FEEDBACK REQUEST
function deliveredTemplate(order) {
  return baseTemplate(`
    <h2>Your Order Has Been Delivered! 📦✅</h2>
    <p>Hi <strong>${order.userName || 'Customer'}</strong>, your order has been successfully delivered. We hope you love your purchase!</p>
    <div class="card">
      <p style="margin:0 0 4px"><strong>Order ID:</strong> ${order.orderId}</p>
      <p style="margin:0"><strong>Delivered On:</strong> ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    <p>We'd love to hear your thoughts! Please rate your products in the quickCart app.</p>
    <p>Thank you for choosing quickCart. See you again soon! 🛒</p>
  `);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HTTP ENDPOINTS (called from Expo app)
// ═══════════════════════════════════════════════════════════════════════════════

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');
}

// ── Send OTP
exports.sendOTP = functions.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  const { email, otp } = req.body;
  if (!email || !otp) { res.status(400).send({ error: 'email and otp required' }); return; }
  const ok = await sendEmail(email, 'quickCart – Your Verification Code', otpTemplate(otp));
  ok ? res.status(200).send({ success: true }) : res.status(500).send({ error: 'Failed to send email' });
});

// ── Send Welcome Email
exports.sendWelcomeEmail = functions.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  const { email, name } = req.body;
  if (!email || !name) { res.status(400).send({ error: 'email and name required' }); return; }

  // Prevent duplicate welcome emails
  const already = await wasEmailSent(`users/${email.toLowerCase()}`, 'welcome');
  if (already) { res.status(200).send({ success: true, skipped: true }); return; }

  const ok = await sendEmail(email, `Welcome to quickCart, ${name}! 🎉`, welcomeTemplate(name));
  if (ok) await recordEmailSent(`users/${email.toLowerCase()}`, 'welcome');
  ok ? res.status(200).send({ success: true }) : res.status(500).send({ error: 'Failed to send email' });
});

// ── Send Forgot Password OTP
exports.sendForgotPasswordEmail = functions.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  const { email, name, otp } = req.body;
  if (!email || !otp) { res.status(400).send({ error: 'email and otp required' }); return; }
  const ok = await sendEmail(email, 'quickCart – Password Reset Code', forgotPasswordTemplate(name || 'Customer', otp));
  ok ? res.status(200).send({ success: true }) : res.status(500).send({ error: 'Failed to send email' });
});

// ── Send Order Confirmation
exports.sendOrderConfirmation = functions.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  const { order } = req.body;
  if (!order || !order.userEmail) { res.status(400).send({ error: 'order data required' }); return; }

  const already = await wasEmailSent(`orders/${order.orderId}`, 'orderPlaced');
  if (already) { res.status(200).send({ success: true, skipped: true }); return; }

  const ok = await sendEmail(order.userEmail, `Order Confirmed – ${order.orderId} | quickCart`, orderConfirmationTemplate(order));
  if (ok) await recordEmailSent(`orders/${order.orderId}`, 'orderPlaced');
  ok ? res.status(200).send({ success: true }) : res.status(500).send({ error: 'Failed to send email' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FIRESTORE TRIGGER — Order Status Change
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  'Confirmed': {
    emoji: '✅', title: 'Order Confirmed',
    message: 'your order has been confirmed by our team and is being prepared.',
    extra: '', footer: 'We\'ll notify you when your items are ready to ship!',
    itemsTable: false, subjectSuffix: 'Order Confirmed',
  },
  'Preparing': {
    emoji: '👨‍🍳', title: 'Order is Being Prepared',
    message: 'great news! Our team is now preparing your order.',
    extra: '', footer: 'Your items are being carefully packed for delivery.',
    itemsTable: false, subjectSuffix: 'Preparing Your Order',
  },
  'Packed': {
    emoji: '📦', title: 'Order Packed & Ready',
    message: 'your order has been packed and is ready for pickup by our delivery partner.',
    extra: '', footer: 'Sit tight, it\'s on its way!',
    itemsTable: false, subjectSuffix: 'Order Packed',
  },
  'Dispatched': {
    emoji: '🚚', title: 'Order Dispatched',
    message: 'your order is on its way! Our delivery partner has picked up your package.',
    extra: '<p style="margin:4px 0"><strong>Delivery Partner:</strong> quickCart Logistics</p>',
    footer: 'Track your order in the quickCart app.',
    itemsTable: false, subjectSuffix: 'Order Dispatched',
  },
  'Out For Delivery': {
    emoji: '🏃', title: 'Out For Delivery',
    message: 'your order is almost there! Our delivery executive is on the way.',
    extra: '<p style="margin:4px 0"><strong>Expected:</strong> Today by 8:00 PM</p>',
    footer: 'Please ensure someone is available to receive the package.',
    itemsTable: false, subjectSuffix: 'Out For Delivery',
  },
  'Cancelled': {
    emoji: '❌', title: 'Order Cancelled',
    message: 'your order has been cancelled.',
    extra: '<p style="margin:4px 0"><strong>Refund:</strong> Will be processed within 5–7 business days if payment was made.</p>',
    footer: 'We\'re sorry to see your order cancelled. Feel free to shop again!',
    itemsTable: false, subjectSuffix: 'Order Cancelled',
  },
  'Refund Initiated': {
    emoji: '🔄', title: 'Refund Initiated',
    message: 'your refund has been initiated.',
    extra: '<p style="margin:4px 0"><strong>Timeline:</strong> 5–7 business days</p>',
    footer: 'Please check your bank account or payment method for the refund.',
    itemsTable: false, subjectSuffix: 'Refund Initiated',
  },
  'Refunded': {
    emoji: '💰', title: 'Refund Completed',
    message: 'your refund has been successfully credited to your original payment method.',
    extra: '<p style="margin:4px 0"><strong>Status:</strong> Completed</p>',
    footer: 'Thank you for your patience. Hope to see you again!',
    itemsTable: false, subjectSuffix: 'Refund Completed',
  },
};

exports.onOrderStatusChange = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const orderId = context.params.orderId;

    // Only process if status actually changed
    if (before.status === after.status) return null;

    const newStatus = after.status;
    console.log(`Order ${orderId} status changed: ${before.status} → ${newStatus}`);

    // Handle Delivered separately (special template with feedback request)
    if (newStatus === 'Delivered') {
      const already = await wasEmailSent(`orders/${orderId}`, 'delivered');
      if (already) return null;
      const ok = await sendEmail(
        after.userEmail,
        `📦 Delivered – Order ${orderId} | quickCart`,
        deliveredTemplate(after)
      );
      if (ok) await recordEmailSent(`orders/${orderId}`, 'delivered');
      return null;
    }

    // Handle known status configs
    const config = STATUS_CONFIG[newStatus];
    if (!config) {
      console.log(`No email template configured for status: ${newStatus}`);
      return null;
    }

    // Prevent duplicate emails for this status
    const emailKey = newStatus.replace(/\s+/g, '_').toLowerCase();
    const already = await wasEmailSent(`orders/${orderId}`, emailKey);
    if (already) return null;

    const html = orderStatusTemplate(after, config);
    const ok = await sendEmail(
      after.userEmail,
      `${config.emoji} ${config.subjectSuffix} – Order ${orderId} | quickCart`,
      html
    );
    if (ok) await recordEmailSent(`orders/${orderId}`, emailKey);
    return null;
  });

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULED FUNCTION — Cart Reminder (runs every 6 hours, checks carts idle 24h+)
// ═══════════════════════════════════════════════════════════════════════════════

exports.cartReminderScheduled = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const cartsSnap = await db.collection('carts')
      .where('updatedAt', '<', cutoff)
      .where('reminderSent', '==', false)
      .get();

    const promises = cartsSnap.docs.map(async (cartDoc) => {
      const cart = cartDoc.data();
      if (!cart.items || cart.items.length === 0) return;
      if (!cart.userEmail) return;

      const userName = cart.userName || 'Customer';
      const ok = await sendEmail(
        cart.userEmail,
        '🛒 You left items in your quickCart!',
        cartReminderTemplate(userName, cart.items)
      );
      if (ok) {
        await cartDoc.ref.update({ reminderSent: true });
      }
    });

    await Promise.all(promises);
    console.log(`Cart reminder: processed ${cartsSnap.docs.length} carts`);
    return null;
  });

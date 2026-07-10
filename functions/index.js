const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

exports.sendOTP = functions.https.onRequest(async (req, res) => {
  // CORS Headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).send({ error: 'Email and OTP are required' });
      return;
    }

    const gmailUser = functions.config().gmail?.user || process.env.GMAIL_USER || 'quicckcart@gmail.com';
    const gmailPass = functions.config().gmail?.pass || process.env.GMAIL_PASS;

    if (!gmailPass) {
      res.status(500).send({ error: 'GMAIL_PASS (App Password) is not configured in Firebase Cloud Functions.' });
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });

    const mailOptions = {
      from: `"quickCart" <${gmailUser}>`,
      to: email,
      subject: 'quickCart Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4CAF50;">quickCart Verification</h2>
          <p>Thank you for signing up with quickCart! Use the following One-Time Password (OTP) to complete your registration:</p>
          <div style="font-size: 24px; font-weight: bold; background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px; letter-spacing: 5px; margin: 20px 0; color: #333;">
            ${otp}
          </div>
          <p>This code is valid for 5 minutes and can only be used once.</p>
          <p>If you did not request this code, please ignore this email.</p>
          <br/>
          <p>Best regards,<br/>The quickCart Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send({ success: true });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).send({ error: error.message });
  }
});

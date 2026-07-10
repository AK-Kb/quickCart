const http = require('http');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Port to listen on
const PORT = 3000;

// Create HTTP Server
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/send-otp') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { email, otp } = JSON.parse(body);
        if (!email || !otp) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Email and OTP are required' }));
          return;
        }

        console.log(`Sending OTP ${otp} to ${email}...`);

        // Load configuration from local config file
        let gmailUser = 'quicckcart@gmail.com'; // Default or from env
        let gmailPass = ''; // App Password from env

        // Try reading from .env.otp
        try {
          const envPath = path.join(__dirname, '../.env.otp');
          if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n');
            lines.forEach(line => {
              const [key, val] = line.split('=');
              if (key && val) {
                if (key.trim() === 'GMAIL_USER') gmailUser = val.trim();
                if (key.trim() === 'GMAIL_PASS') gmailPass = val.trim();
              }
            });
          }
        } catch (e) {
          console.error('Error reading .env.otp:', e);
        }

        if (!gmailPass) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'GMAIL_PASS (App Password) is not configured in .env.otp. Please configure it to send real emails.' 
          }));
          return;
        }

        // Configure Nodemailer Transporter
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
        console.log(`OTP successfully sent to ${email}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('Failed to send email:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`quickCart OTP Mail Server running on port ${PORT}`);
  console.log('To send real emails, create .env.otp in the root directory with GMAIL_USER and GMAIL_PASS.');
});

/**
 * quickCart Email Service
 * Sends email notifications through the local OTP backend (dev)
 * or Firebase Cloud Functions (production).
 * Never stores credentials — all secrets live on the backend.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Resolve the correct backend base URL depending on platform and environment
function getBackendUrl(): string {
  const hostUri = Constants.expoConfig?.hostUri || '';
  let hostIp = hostUri ? hostUri.split(':')[0] : 'localhost';

  // Android emulator maps host machine to 10.0.2.2
  if (hostIp === 'localhost' && Platform.OS === 'android') {
    hostIp = '10.0.2.2';
  }

  return `http://${hostIp}:3000`;
}

// Cloud Function base URL (used as fallback)
const CF_BASE = 'https://us-central1-quickcart-3cd3e.cloudfunctions.net';

async function post(localPath: string, cfPath: string, body: object): Promise<boolean> {
  const baseUrl = getBackendUrl();

  // Try local backend first (fast during development)
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${baseUrl}${localPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    if (res.ok) return true;
    throw new Error(`Local server responded ${res.status}`);
  } catch {
    // Fallback: Firebase Cloud Function
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(`${CF_BASE}${cfPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      return res.ok;
    } catch {
      console.warn(`[EmailService] All delivery attempts failed for ${localPath}`);
      return false;
    }
  }
}

export const EmailService = {
  /** Send OTP verification code */
  sendOTP: (email: string, otp: string) =>
    post('/send-otp', '/sendOTP', { email, otp }),

  /** Send welcome email after successful registration */
  sendWelcome: (email: string, name: string) =>
    post('/send-welcome', '/sendWelcomeEmail', { email, name }),

  /** Send forgot-password OTP */
  sendForgotPassword: (email: string, name: string, otp: string) =>
    post('/send-forgot-password', '/sendForgotPasswordEmail', { email, name, otp }),

  /** Send order confirmation email */
  sendOrderConfirmation: (order: object) =>
    post('/send-order-confirmation', '/sendOrderConfirmation', { order }),

  /** Send order status update email (Confirmed, Dispatched, etc.) */
  sendOrderStatus: (order: object, status: string) =>
    post('/send-order-status', '/sendOrderStatus', { order, status }),

  /** Send cart reminder email */
  sendCartReminder: (email: string, name: string, items: object[]) =>
    post('/send-cart-reminder', '/sendCartReminder', { email, name, items }),
};

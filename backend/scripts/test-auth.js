/**
 * Authentication module integration test
 * Uses MongoDB Memory Server — no external MongoDB required.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

process.env.PORT = process.env.TEST_PORT || '5099';

const BASE_URL = `http://localhost:${process.env.PORT}/api/v1/auth`;
let memoryServer;
let testEmail;
let testOtp;
let accessToken;
let cookies = '';

const request = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (cookies) headers.Cookie = cookies;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    cookies = setCookie.split(';')[0];
  }

  const data = await response.json();
  return { status: response.status, data };
};

const assert = (condition, message, detail = '') => {
  if (!condition) throw new Error(`FAIL: ${message}${detail ? ` — ${detail}` : ''}`);
  console.log(`PASS: ${message}`);
};

const runTests = async () => {
  console.log('\n=== Auth Module Integration Tests ===\n');

  memoryServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = memoryServer.getUri();
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

  const { startServer } = await import('../server.js');
  await startServer();
  await new Promise((r) => setTimeout(r, 2500));

  testEmail = `test${Date.now()}@fleet.com`;

  // Register
  const registerRes = await request('/register', {
    method: 'POST',
    body: {
      firstName: 'Test',
      lastName: 'User',
      email: testEmail,
      password: 'Test@123456',
      phone: '+1234567890',
    },
  });
  assert(registerRes.status === 201, 'Register returns 201', JSON.stringify(registerRes.data));
  assert(registerRes.data.success === true, 'Register success flag');

  // Get OTP from database
  const User = (await import('../models/User.js')).default;
  const user = await User.findOne({ email: testEmail }).select('+otp');
  testOtp = user.otp.code;
  assert(testOtp?.length === 6, 'OTP generated in database');

  // Verify OTP
  const verifyRes = await request('/verify-otp', {
    method: 'POST',
    body: { email: testEmail, otp: testOtp },
  });
  assert(verifyRes.status === 200, 'Verify OTP returns 200');
  accessToken = verifyRes.data.data.accessToken;
  assert(!!accessToken, 'Access token received after verification');
  assert(!!cookies, 'Refresh token cookie set');

  // Get Me
  const meRes = await request('/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert(meRes.status === 200, 'Get me returns 200');
  assert(meRes.data.data.user.email === testEmail, 'Get me returns correct user');

  // Logout
  const logoutRes = await request('/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert(logoutRes.status === 200, 'Logout returns 200');

  // Login
  const loginRes = await request('/login', {
    method: 'POST',
    body: { email: testEmail, password: 'Test@123456' },
  });
  assert(loginRes.status === 200, 'Login returns 200');
  accessToken = loginRes.data.data.accessToken;

  // Refresh token
  const refreshRes = await request('/refresh-token', {
    method: 'POST',
  });
  assert(refreshRes.status === 200, 'Refresh token returns 200');
  assert(!!refreshRes.data.data.accessToken, 'New access token from refresh');

  // Forgot password
  const forgotRes = await request('/forgot-password', {
    method: 'POST',
    body: { email: testEmail },
  });
  assert(forgotRes.status === 200, 'Forgot password returns 200');

  const userWithReset = await User.findOne({ email: testEmail }).select('+otp');
  const resetOtp = userWithReset.otp.code;

  // Reset password
  const resetRes = await request('/reset-password', {
    method: 'POST',
    body: { email: testEmail, otp: resetOtp, password: 'NewTest@123456' },
  });
  assert(resetRes.status === 200, 'Reset password returns 200');

  // Login with new password
  const newLoginRes = await request('/login', {
    method: 'POST',
    body: { email: testEmail, password: 'NewTest@123456' },
  });
  assert(newLoginRes.status === 200, 'Login with new password returns 200');

  // Invalid login
  const badLogin = await request('/login', {
    method: 'POST',
    body: { email: testEmail, password: 'WrongPass@123' },
  });
  assert(badLogin.status === 401, 'Invalid login returns 401');

  console.log('\n=== All Auth Tests Passed ===\n');
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
  process.exit(0);
};

runTests().catch(async (err) => {
  console.error('\nTest suite failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  if (memoryServer) await memoryServer.stop().catch(() => {});
  process.exit(1);
});

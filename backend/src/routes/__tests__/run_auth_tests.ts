import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../app';
import { storage } from '../../db/storage';

async function runTests() {
  console.log('[Test] Initializing database storage...');
  await storage.init();
  console.log('[Test] Storage ready.');

  console.log('\n--- 1. Testing Registration Validation ---');

  // Test: Name too short
  {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'A',
        email: 'valid@example.com',
        password: 'Password123!',
        currency: 'USD'
      });
    assert.strictEqual(res.status, 400, 'Should reject name < 2 chars');
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('Name must be at least 2 characters'), `Expected error message: ${res.body.error}`);
    console.log('✓ Rejected name with < 2 characters');
  }

  // Test: Invalid email
  {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'invalid-email-address',
        password: 'Password123!',
        currency: 'USD'
      });
    assert.strictEqual(res.status, 400, 'Should reject invalid email');
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('valid email address'), `Expected email error: ${res.body.error}`);
    console.log('✓ Rejected invalid email format');
  }

  // Test: Password too short
  {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: '123',
        currency: 'USD'
      });
    assert.strictEqual(res.status, 400, 'Should reject short password');
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('Password must be at least 6 characters'), `Expected password error: ${res.body.error}`);
    console.log('✓ Rejected password < 6 characters');
  }

  // Test: Unsupported currency
  {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        currency: 'FAKE_CURR'
      });
    assert.strictEqual(res.status, 400, 'Should reject invalid currency');
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('Currency must be one of'), `Expected currency error: ${res.body.error}`);
    console.log('✓ Rejected unsupported currency');
  }

  // Test: Valid registration
  const uniqueEmail = `test_${Date.now()}@example.com`;
  {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe',
        email: uniqueEmail,
        password: 'StrongPassword123!',
        currency: 'USD'
      });
    assert.strictEqual(res.status, 201, 'Should successfully register');
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token, 'Token should be returned');
    assert.strictEqual(res.body.user.email, uniqueEmail);
    assert.strictEqual(res.body.user.name, 'Jane Doe');
    console.log('✓ Successfully registered new user with valid inputs');
  }

  // Test: Duplicate email registration
  {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Duplicate',
        email: uniqueEmail,
        password: 'StrongPassword123!',
        currency: 'USD'
      });
    assert.strictEqual(res.status, 400, 'Should reject duplicate email');
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('already exists'), `Expected already exists error: ${res.body.error}`);
    console.log('✓ Rejected duplicate email registration');
  }

  console.log('\n--- 2. Testing Login Validation ---');

  // Test: Login invalid email
  {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'not-valid-email',
        password: 'Password123!'
      });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('valid email address'));
    console.log('✓ Rejected login with invalid email');
  }

  // Test: Login empty password
  {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'valid@example.com',
        password: ''
      });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('Password is required'));
    console.log('✓ Rejected login with empty password');
  }

  // Test: Login with valid credentials
  {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password: 'StrongPassword123!'
      });
    assert.strictEqual(res.status, 200, 'Should log in successfully');
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token, 'Login should return token');
    console.log('✓ Successfully logged in with correct credentials');
  }

  // Test: Login with wrong password
  {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password: 'WrongPassword999!'
      });
    assert.strictEqual(res.status, 401, 'Should reject wrong password');
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Invalid email or password.');
    console.log('✓ Rejected login with wrong password');
  }

  console.log('\n--- 3. Testing Google Auth Validation ---');

  // Test: Google auth without credential
  {
    const res = await request(app)
      .post('/api/auth/google')
      .send({});
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    console.log('✓ Rejected Google auth without credential');
  }

  // Test: Google auth with invalid/short credential
  {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'short' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('Google credential token'));
    console.log('✓ Rejected Google auth with short credential token');
  }

  console.log('\n🎉 ALL AUTH & VALIDATION TESTS PASSED PERFECTLY!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});

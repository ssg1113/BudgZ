import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { storage } from '../../db/storage';

describe('Auth Routes & Input Validations', () => {
  beforeAll(async () => {
    await storage.init();
  });

  describe('POST /api/auth/register input validations', () => {
    it('should reject registration with name shorter than 2 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'A',
          email: 'valid@example.com',
          password: 'Password123!',
          currency: 'USD'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Name must be at least 2 characters');
    });

    it('should reject registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'not-an-email',
          password: 'Password123!',
          currency: 'USD'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('valid email address');
    });

    it('should reject registration with password shorter than 6 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'johndoe@example.com',
          password: '123',
          currency: 'USD'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Password must be at least 6 characters');
    });

    it('should reject registration with unsupported currency', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'johndoe@example.com',
          password: 'Password123!',
          currency: 'INVALID_CURR'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Currency must be one of');
    });

    it('should successfully register with valid inputs', async () => {
      const testEmail = `testuser_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sarah Connor',
          email: testEmail,
          password: 'SecurePassword123!',
          currency: 'EUR'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.name).toBe('Sarah Connor');
      expect(res.body.user.currency).toBe('EUR');
    });
  });

  describe('POST /api/auth/login input validations', () => {
    it('should reject login with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email-str',
          password: 'Password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('valid email address');
    });

    it('should reject login with empty password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'someone@example.com',
          password: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Password is required');
    });
  });

  describe('POST /api/auth/google input validations', () => {
    it('should reject google auth without credential', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject google auth with invalid credential token', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Google credential token');
    });
  });
});

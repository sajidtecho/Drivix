import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';

describe('Auth API Integration Tests', () => {
  const testEmail = `testuser_${Date.now()}@gmail.com`;
  const testPassword = 'password123';
  const testMobile = '+919876543210';

  // Cleanup DB connections after tests complete
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully without OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test Jest User',
          email: testEmail,
          password: testPassword,
          mobile: testMobile,
          city: 'Delhi'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toEqual(testEmail);
    });

    it('should prevent duplicate registration', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test Jest User',
          email: testEmail,
          password: testPassword,
          mobile: testMobile,
          city: 'Delhi'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/exists/i);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in successfully and return a token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toEqual(testEmail);
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
    });
  });
});

import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { storage } from '../db/storage';
import { config } from '../config';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AuthUserPayload } from '../types';

export const authRouter = Router();

const googleClient = new OAuth2Client(config.googleClientId || undefined);

// Allowed currencies (LKR is the primary currency)
const SUPPORTED_CURRENCIES = ['LKR', 'USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'] as const;

// Input Validation Schemas
const registerSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters'),
  currency: z.enum(SUPPORTED_CURRENCIES, {
    errorMap: () => ({ message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}` })
  }).default('LKR')
});

const loginSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z.string()
    .min(1, 'Password is required')
});

const googleAuthSchema = z.object({
  credential: z.string().min(10, 'Google credential token is required')
});

const updateProfileSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  currency: z.enum(SUPPORTED_CURRENCIES, {
    errorMap: () => ({ message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}` })
  }).optional(),
  preferences: z.object({
    notificationThreshold: z.number().min(1, 'Threshold must be at least 1%').max(100, 'Threshold cannot exceed 100%').optional(),
    browserNotificationsEnabled: z.boolean().optional()
  }).optional()
});

function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

async function verifyGoogleToken(idToken: string) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.googleClientId || undefined
    });
    return ticket.getPayload();
  } catch (err: any) {
    // Fallback verification via Google's tokeninfo API
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      if (response.ok) {
        const payload = await response.json();
        return payload;
      }
    } catch {
      // ignore
    }
    throw new Error(`Google authentication failed: ${err.message || 'Invalid or expired token'}`);
  }
}

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
authRouter.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await storage.findUserByEmail(data.email);
    if (existing) {
      res.status(400).json({ success: false, error: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await storage.createUser({
      name: data.name,
      email: data.email,
      passwordHash,
      authProvider: 'local',
      currency: data.currency || 'LKR',
      preferences: {
        notificationThreshold: 80,
        browserNotificationsEnabled: true
      }
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      currency: user.currency
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        authProvider: user.authProvider || 'local',
        avatar: user.avatar || '',
        preferences: user.preferences
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Log in with email and password
 */
authRouter.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await storage.findUserByEmail(data.email);

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    if (!user.passwordHash) {
      res.status(401).json({
        success: false,
        error: 'This account was created with Google Sign-In. Please sign in with Google.'
      });
      return;
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      currency: user.currency
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        authProvider: user.authProvider || 'local',
        avatar: user.avatar || '',
        preferences: user.preferences
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/google
 * Authenticate with Google Identity Services ID Token
 */
authRouter.post('/google', async (req, res, next) => {
  try {
    const data = googleAuthSchema.parse(req.body);
    const payload = await verifyGoogleToken(data.credential);

    if (!payload || !payload.email) {
      res.status(400).json({ success: false, error: 'Failed to retrieve email from Google credential.' });
      return;
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    const name = payload.name || payload.given_name || email.split('@')[0];
    const avatar = payload.picture || '';

    // Check if user already exists with this googleId
    let user = await storage.findUserByGoogleId(googleId);

    if (!user) {
      // Check if user exists with this email (e.g. registered with password previously)
      user = await storage.findUserByEmail(email);
      if (user) {
        // Link Google ID and avatar
        user = await storage.updateUser(user.id, {
          googleId,
          avatar: avatar || user.avatar,
          authProvider: user.authProvider || 'google'
        });
      } else {
        // Create new user for Google Sign-In
        user = await storage.createUser({
          name,
          email,
          googleId,
          avatar,
          authProvider: 'google',
          currency: 'LKR',
          preferences: {
            notificationThreshold: 80,
            browserNotificationsEnabled: true
          }
        });
      }
    }

    if (!user) {
      res.status(500).json({ success: false, error: 'Failed to process Google account.' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      currency: user.currency
    });

    res.json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        authProvider: user.authProvider || 'google',
        avatar: user.avatar || '',
        preferences: user.preferences
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
authRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = await storage.findUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        authProvider: user.authProvider || 'local',
        avatar: user.avatar || '',
        preferences: user.preferences
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/auth/me
 * Update user preferences and profile
 */
authRouter.patch('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await storage.findUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const updatedUser = await storage.updateUser(req.user!.id, {
      ...(data.name && { name: data.name }),
      ...(data.currency && { currency: data.currency }),
      ...(data.preferences && {
        preferences: {
          ...user.preferences,
          ...data.preferences
        }
      })
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
});

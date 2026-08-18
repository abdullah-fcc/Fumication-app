import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import jobRoutes from './routes/jobs.routes';
import inventoryRoutes from './routes/inventory.routes';
import reportRoutes from './routes/reports.routes';
import locationRoutes from './routes/locations.routes';
import checkInRoutes from './routes/checkins.routes';
import notificationRoutes from './routes/notifications.routes';

dotenv.config();

// Refuse to run unauthenticated-by-accident: without a signing secret every
// token check fails closed, but the cause is invisible in the 401s it produces.
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set — refusing to start without it.');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Vercel terminates TLS upstream, so the client IP is in X-Forwarded-For.
// Without this the rate limiter buckets every request under the proxy address.
app.set('trust proxy', 1);

// Browser clients that are allowed to call this API with credentials/headers.
// Native apps (mobile) and server-to-server calls send no Origin header at all,
// so they're unaffected by this allowlist — CORS is enforced by browsers only.
// Any localhost port is allowed (the dev server's port varies machine to machine),
// production is locked to the deployed web app's exact origin.
const PROD_ORIGIN = 'https://fumication-app-web.vercel.app';
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use(helmet());
const allowLocalhost = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === PROD_ORIGIN || (allowLocalhost && LOCALHOST_ORIGIN.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));

// Tighter limiter on auth endpoints specifically, to slow down credential
// stuffing / brute-force login and mass-registration attempts.
// NOTE: this uses express-rate-limit's default in-memory store. On Vercel each
// serverless instance keeps its own counter, so the effective ceiling is higher
// than `max` and resets constantly. Backing it with a shared store (Redis /
// Upstash) is required to make this a real brute-force control in production.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'Insta Fumigation API is running', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/check-ins', checkInRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Catch-all error handler. Without this, Express's own default handler can
// leak stack traces and absolute file paths to the client whenever NODE_ENV
// isn't explicitly "production" (e.g. local dev, or a host that doesn't set
// it the way Vercel does) — so never rely on that, always respond generically.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err?.message);
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    res.status(400).json({ error: 'Invalid JSON in request body' });
    return;
  }
  res.status(500).json({ error: 'Server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Insta Fumigation API running on port ${PORT}`);
  });
}

export default app;

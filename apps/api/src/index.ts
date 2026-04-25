import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'FumiGuard API is running', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`FumiGuard API running on port ${PORT}`);
});

export default app;

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from '../backend/src/routes/api';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', apiRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FairBuy AI Backend Engine (Vercel Serverless)',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default app;

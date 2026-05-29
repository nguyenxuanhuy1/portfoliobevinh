import express from 'express';
import passport from 'passport';
import cors from 'cors';
import './config/passport.js';
import router from './routes/index.js';

const app = express();

app.use(cors({
  origin: process.env.BASE_URL_FE, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(passport.initialize());
app.use('/', router);

export default app;
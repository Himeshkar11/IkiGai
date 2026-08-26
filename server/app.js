const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Routes
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const todoRoutes = require('./routes/todoRoutes');
const foodRoutes = require('./routes/foodRoutes');
const foodLogRoutes = require('./routes/foodLogRoutes');
const roomRoutes = require('./routes/room');
const moneyRoutes = require('./routes/moneyRoutes');
const aiRoutes = require('./routes/aiRoutes');


const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to IkiGai API',
  });
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/food-logs', foodLogRoutes);
app.use('/api/room', roomRoutes);
app.use('/api/money', moneyRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.path} not found`,
  });
});

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;

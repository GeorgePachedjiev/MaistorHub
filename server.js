require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const mastersRoutes = require('./routes/masters');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/masters', mastersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Възникна грешка на сървъра',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрутът не е намерен' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`MaistorHub API сървър работи на порт ${PORT}`);
});

module.exports = app;

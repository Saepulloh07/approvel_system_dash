const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const cutiRoutes = require('./src/routes/cutiRoutes');

const app = express();

// Middleware Keamanan & Parsing
app.use(helmet()); // Mengamankan header HTTP
app.use(cors());   // Mengizinkan akses API dari frontend
app.use(express.json()); // Parsing application/json
app.use(express.urlencoded({ extended: true }));

// Mendaftarkan Routes
app.use('/api/auth', authRoutes);
app.use('/api/cuti', cutiRoutes);

// Handling 404 Route Not Found
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// Menjalankan Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan pada port ${PORT}`);
});
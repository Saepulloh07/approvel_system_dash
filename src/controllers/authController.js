const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * LOGIN
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password wajib diisi'
            });
        }

        // Sesuaikan dengan nama tabel Anda
        const [rows] = await db.execute(
            'SELECT * FROM mlite_users WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET belum dikonfigurasi');
        }

        const payload = {
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            role: user.role,
            access: user.access
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '8h'
        });

        return res.status(200).json({
            success: true,
            message: 'Login berhasil',
            data: {
                user: payload,
                token
            }
        });

    } catch (error) {
        console.error('Login Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

/**
 * REGISTER
 */
const register = async (req, res) => {
    try {
        const {
            username,
            fullname,
            password,
            email,
            role,
            access
        } = req.body;

        if (!username || !fullname || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, fullname, dan password wajib diisi'
            });
        }
        // Gunakan nama tabel yang sama
        const [existingUser] = await db.execute(
            'SELECT id FROM mlite_users WHERE username = ?',
            [username]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username sudah terdaftar'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            `INSERT INTO mlite_users
            (username, fullname, password, email, role, access)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                username,
                fullname,
                hashedPassword,
                email || '',
                role || 'user',
                access || 'limited'
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'User berhasil didaftarkan'
        });

    } catch (error) {
        console.error('Register Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

module.exports = {
    login,
    register
};
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    // Ambil token dari header Authorization (Format: Bearer )
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Token tidak disediakan.'
        });
    }

    try {
        // Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Simpan data user ke object request untuk dipakai di controller
        next(); // Lanjut ke controller
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token tidak valid atau sudah kedaluwarsa.'
        });
    }
};
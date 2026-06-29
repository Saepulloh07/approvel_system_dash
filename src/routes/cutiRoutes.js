const express = require('express');
const router = express.Router();
const cutiController = require('../controllers/cutiController');
const { verifyToken } = require('../middleware/authMiddleware');

// Endpoint: PUT /api/cuti/:no_pengajuan/status
// Middleware verifyToken dipasang untuk melindungi endpoint ini
router.put('/:no_pengajuan/status', verifyToken, cutiController.updateStatusCuti);
router.get('/', verifyToken, cutiController.getListCuti);

module.exports = router;
const db = require('../config/db');

const updateStatusCuti = async (req, res) => {
    try {
        const { no_pengajuan } = req.params;
        const { status } = req.body;

        // 1. Validasi input status agar sistem tidak menerima input sembarangan
        const validStatus = ['Disetujui', 'Ditolak'];
        if (!validStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status tidak valid. Gunakan "Disetujui" atau "Ditolak".'
            });
        }

        // 2. Cek apakah nomor pengajuan tersebut ada di database
        const [existing] = await db.execute(
            'SELECT no_pengajuan FROM pengajuan_cuti WHERE no_pengajuan = ?',
            [no_pengajuan]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data pengajuan cuti tidak ditemukan.'
            });
        }

        // 3. Update status cuti
        await db.execute(
            'UPDATE pengajuan_cuti SET status = ? WHERE no_pengajuan = ?',
            [status, no_pengajuan]
        );

        // Opsional: Anda bisa menggunakan req.user (dari JWT) untuk mencatat siapa yang melakukan approve
        // console.log(`Cuti ${no_pengajuan} diubah menjadi ${status} oleh user ID: ${req.user.id}`);

        res.status(200).json({
            success: true,
            message: `Pengajuan cuti ${no_pengajuan} berhasil diupdate menjadi ${status}.`
        });

    } catch (error) {
        console.error('Update Cuti Error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server.'
        });
    }
};

const getListCuti = async (req, res) => {
    try {
        // Query SQL menggunakan LEFT JOIN untuk menggabungkan data
        // Kita alias-kan pengajuan_cuti sebagai 'pc' dan pegawai sebagai 'p'
        const query = `
            SELECT 
                pc.no_pengajuan, 
                pc.tanggal, 
                pc.tanggal_awal, 
                pc.tanggal_akhir, 
                pc.nik, 
                p.nama AS nama_pegawai, 
                p.departemen,
                pc.urgensi, 
                pc.alamat, 
                pc.jumlah, 
                pc.kepentingan, 
                pc.nik_pj, 
                pc.status
            FROM pengajuan_cuti pc
            LEFT JOIN pegawai p ON pc.nik = p.nik
            ORDER BY pc.tanggal DESC
        `;

        const [rows] = await db.execute(query);

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil daftar pengajuan cuti',
            data: rows
        });

    } catch (error) {
        console.error('Get List Cuti Error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server saat mengambil data.'
        });
    }
};

module.exports = { updateStatusCuti, getListCuti };
import express from "express";
import path from "path";
import jwt from "jsonwebtoken";
import cors from "cors";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 5000;
const SECRET_KEY = process.env.JWT_SECRET || "rahasia_negara_123";

app.use(cors());
app.use(express.json());

let cutiData = []

// Auth Middleware
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({
      success: false,
      message: "Akses ditolak. Token tidak disediakan."
    });
  }

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid atau sudah kadaluarsa."
      });
    }
    (req as any).user = user;
    next();
  });
};

// 1. Autentikasi (Login)
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (username && password) {
    const user = {
      id: 2,
      username: "admin",
      fullname: "Administrator",
      role: "admin",
      access: "all"
    };

    const token = jwt.sign(user, SECRET_KEY, { expiresIn: '1h' });

    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        user,
        token
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Username atau password salah"
    });
  }
});

// 2. Ambil Daftar Pengajuan Cuti
app.get("/api/cuti", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Berhasil mengambil daftar pengajuan cuti",
    data: cutiData
  });
});

// 3. Update Status Pengajuan Cuti (Approve/Reject)
app.put("/api/cuti/:no_pengajuan/status", authenticateToken, (req, res) => {
  const { no_pengajuan } = req.params;
  const { status } = req.body;

  if (status !== "Disetujui" && status !== "Ditolak") {
    return res.status(400).json({
      success: false,
      message: 'Status tidak valid. Gunakan "Disetujui" atau "Ditolak".'
    });
  }

  const index = cutiData.findIndex(c => c.no_pengajuan === no_pengajuan);

  if (index !== -1) {
    cutiData[index].status = status;
    res.json({
      success: true,
      message: `Pengajuan cuti ${no_pengajuan} berhasil diupdate menjadi ${status}.`
    });
  } else {
    res.status(404).json({
      success: false,
      message: "Data pengajuan cuti tidak ditemukan."
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express v4
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

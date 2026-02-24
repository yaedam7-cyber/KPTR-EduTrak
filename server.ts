import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const db = new Database('training.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT UNIQUE NOT NULL,
    password TEXT,
    name TEXT NOT NULL,
    department TEXT,
    role TEXT NOT NULL DEFAULT 'student'
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    original_name TEXT NOT NULL,
    passing_score INTEGER NOT NULL DEFAULT 70,
    start_date TEXT,
    end_date TEXT
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    options TEXT NOT NULL, -- JSON array
    correct_option_index INTEGER NOT NULL,
    FOREIGN KEY(material_id) REFERENCES materials(id)
  );

  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'started', -- 'started', 'completed'
    score INTEGER,
    completed_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(material_id) REFERENCES materials(id),
    UNIQUE(user_id, material_id)
  );
`);

// Insert default admin if not exists
const insertUser = db.prepare('INSERT OR IGNORE INTO users (employee_id, password, name, department, role) VALUES (?, ?, ?, ?, ?)');
insertUser.run('admin', 'admin123', '관리자', '시스템', 'admin');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

  // API Routes
  
  // Login / Register
  app.post('/api/login', (req, res) => {
    const { employee_id, password } = req.body;
    if (!employee_id) return res.status(400).json({ error: '사번을 입력해주세요.' });
    
    let user = db.prepare('SELECT * FROM users WHERE employee_id = ?').get(employee_id);
    if (!user) {
      return res.status(401).json({ error: '등록되지 않은 사번입니다. 관리자에게 문의하세요.' });
    }

    if (user.role === 'admin') {
      if (!password) {
        return res.status(401).json({ error: '관리자 비밀번호를 입력해주세요.', requirePassword: true });
      }
      if (user.password !== password) {
        return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
      }
    }

    res.json(user);
  });

  // Get all users (Admin)
  app.get('/api/users', (req, res) => {
    const users = db.prepare('SELECT * FROM users WHERE role = "student"').all();
    res.json(users);
  });

  // Add user (Admin)
  app.post('/api/users', (req, res) => {
    const { employee_id, name, department } = req.body;
    try {
      const info = db.prepare('INSERT INTO users (employee_id, name, department, role) VALUES (?, ?, ?, ?)').run(employee_id, name, department, 'student');
      res.json({ id: info.lastInsertRowid, employee_id, name, department, role: 'student' });
    } catch (err) {
      res.status(400).json({ error: '이미 등록된 사번이거나 오류가 발생했습니다.' });
    }
  });

  // Delete user (Admin)
  app.delete('/api/users/:id', (req, res) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Change Admin Password
  app.post('/api/admin/password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    console.log('Password change attempt:', { currentPassword, newPassword });
    
    const admin = db.prepare("SELECT * FROM users WHERE role = 'admin' AND employee_id = 'admin'").get() as any;
    console.log('Found admin:', admin);
    
    if (!admin || admin.password !== currentPassword) {
      console.log('Password mismatch or admin not found');
      return res.status(401).json({ error: '현재 비밀번호가 일치하지 않습니다.' });
    }

    try {
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, admin.id);
      console.log('Password updated successfully');
      res.json({ success: true });
    } catch (err) {
      console.error('Error updating password:', err);
      res.status(500).json({ error: '비밀번호 변경 중 오류가 발생했습니다.' });
    }
  });

  // Get all materials
  app.get('/api/materials', (req, res) => {
    const materials = db.prepare('SELECT * FROM materials').all();
    res.json(materials);
  });

  // Get material by id
  app.get('/api/materials/:id', (req, res) => {
    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
    if (!material) return res.status(404).json({ error: 'Material not found' });
    
    const questions = db.prepare('SELECT * FROM questions WHERE material_id = ?').all();
    res.json({ ...material, questions: questions.map(q => ({ ...q, options: JSON.parse(q.options) })) });
  });

  // Upload material (Admin)
  app.post('/api/materials', upload.single('file'), (req, res) => {
    const { title, description, passing_score, questions, start_date, end_date } = req.body;
    const file = req.file;
    
    if (!file) return res.status(400).json({ error: 'File is required' });
    
    const parsedQuestions = questions ? JSON.parse(questions) : [];

    const insertMaterial = db.prepare('INSERT INTO materials (title, description, file_path, file_type, original_name, passing_score, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const info = insertMaterial.run(title, description, file.filename, file.mimetype, file.originalname, passing_score || 70, start_date, end_date);
    const materialId = info.lastInsertRowid;

    if (parsedQuestions.length > 0) {
      const insertQuestion = db.prepare('INSERT INTO questions (material_id, question_text, options, correct_option_index) VALUES (?, ?, ?, ?)');
      const insertMany = db.transaction((qs) => {
        for (const q of qs) {
          insertQuestion.run(materialId, q.question_text, JSON.stringify(q.options), q.correct_option_index);
        }
      });
      insertMany(parsedQuestions);
    }

    res.json({ id: materialId, title, file_path: file.filename });
  });

  // Get progress for a user
  app.get('/api/progress/:userId', (req, res) => {
    const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').all(req.params.userId);
    res.json(progress);
  });

  // Get all progress (Admin)
  app.get('/api/progress', (req, res) => {
    const progress = db.prepare(`
      SELECT p.*, u.name as user_name, u.department, u.employee_id, m.title as material_title 
      FROM progress p 
      JOIN users u ON p.user_id = u.id 
      JOIN materials m ON p.material_id = m.id
    `).all();
    res.json(progress);
  });

  // Update progress (Submit test)
  app.post('/api/progress', (req, res) => {
    const { user_id, material_id, score, status } = req.body;
    
    const existing = db.prepare('SELECT * FROM progress WHERE user_id = ? AND material_id = ?').get(user_id, material_id);
    
    if (existing) {
      // Only update if the new score is higher or status changed to completed
      const newScore = Math.max(existing.score || 0, score || 0);
      const newStatus = status === 'completed' || existing.status === 'completed' ? 'completed' : 'started';
      const completedAt = newStatus === 'completed' && existing.status !== 'completed' ? new Date().toISOString() : existing.completed_at;
      
      db.prepare('UPDATE progress SET score = ?, status = ?, completed_at = ? WHERE id = ?')
        .run(newScore, newStatus, completedAt, existing.id);
    } else {
      const completedAt = status === 'completed' ? new Date().toISOString() : null;
      db.prepare('INSERT INTO progress (user_id, material_id, score, status, completed_at) VALUES (?, ?, ?, ?, ?)')
        .run(user_id, material_id, score || 0, status || 'started', completedAt);
    }
    
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

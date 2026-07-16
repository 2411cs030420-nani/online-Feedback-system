import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to store our feedback records
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'feedback.json');

interface Feedback {
  id: string;
  name: string;
  email: string;
  mobile: string;
  subject: string;
  category: string;
  message: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  created_at: string;
}

// Initial seed data to make the app look complete right away
const seedFeedbacks: Feedback[] = [
  {
    id: "fb-1",
    name: "Arjun Mehta",
    email: "arjun.mehta@example.com",
    mobile: "9876543210",
    subject: "Slow loading speeds on dashboard",
    category: "Technical Issue",
    message: "The main analytical dashboard takes more than 10 seconds to render on mobile networks. Please look into optimizing the script loads.",
    status: "Pending",
    created_at: "2026-07-12T10:30:00.000Z"
  },
  {
    id: "fb-2",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    mobile: "8765432109",
    subject: "Billing amount discrepancy in June receipt",
    category: "Billing",
    message: "My June subscription receipt shows a charge of $49 instead of the agreed $29 promotional rate. I would appreciate a correction and refund of the extra amount.",
    status: "In Progress",
    created_at: "2026-07-13T14:15:00.000Z"
  },
  {
    id: "fb-3",
    name: "Rohan Das",
    email: "rohan.das@example.com",
    mobile: "7654321098",
    subject: "Feature Request: Export reports to Excel/PDF",
    category: "Feature Request",
    message: "It would be extremely helpful if we could export the monthly complaint and feedback summaries to Excel or PDF files directly from the admin view.",
    status: "Resolved",
    created_at: "2026-07-11T09:00:00.000Z"
  },
  {
    id: "fb-4",
    name: "Sneha Nair",
    email: "sneha.nair@example.com",
    mobile: "9988776655",
    subject: "Broken links on documentation page",
    category: "Other",
    message: "In the 'Getting Started' guide, the links pointing to API Authentication headers return a 404 error. Please check and fix the URLs.",
    status: "Resolved",
    created_at: "2026-07-10T16:45:00.000Z"
  }
];

// Ensure data file and directory exist
function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedFeedbacks, null, 2), 'utf8');
  }
}

// Read feedbacks from file
function readFeedbacks(): Feedback[] {
  initDatabase();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading feedback file:", err);
    return [];
  }
}

// Write feedbacks to file
function writeFeedbacks(feedbacks: Feedback[]) {
  initDatabase();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(feedbacks, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing feedback file:", err);
  }
}

// REST API Endpoints

// 1. Submit Feedback (User Module)
app.post('/api/feedback', (req, res) => {
  const { name, email, mobile, subject, category, message } = req.body;

  // Form Validation
  if (!name || !email || !mobile || !subject || !category || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const feedbacks = readFeedbacks();
  const newFeedback: Feedback = {
    id: 'fb-' + Date.now(),
    name,
    email,
    mobile,
    subject,
    category,
    message,
    status: 'Pending',
    created_at: new Date().toISOString()
  };

  feedbacks.unshift(newFeedback); // Insert at the beginning so newest appears first
  writeFeedbacks(feedbacks);

  return res.status(201).json({ 
    success: true, 
    message: "Feedback submitted successfully! Reference ID: " + newFeedback.id,
    data: newFeedback 
  });
});

// 2. Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    return res.json({ 
      success: true, 
      token: "mock-jwt-token-for-admin-session", 
      username: "admin" 
    });
  }
  return res.status(401).json({ error: "Invalid username or password" });
});

// 3. View All Feedbacks with search/filtering (Admin Module)
app.get('/api/feedback', (req, res) => {
  const { search, category, status } = req.query;
  let feedbacks = readFeedbacks();

  if (category) {
    feedbacks = feedbacks.filter(f => f.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (status) {
    feedbacks = feedbacks.filter(f => f.status.toLowerCase() === (status as string).toLowerCase());
  }

  if (search) {
    const searchStr = (search as string).toLowerCase();
    feedbacks = feedbacks.filter(f => 
      f.name.toLowerCase().includes(searchStr) || 
      f.subject.toLowerCase().includes(searchStr) || 
      f.message.toLowerCase().includes(searchStr) ||
      f.email.toLowerCase().includes(searchStr) ||
      f.mobile.includes(searchStr) ||
      f.id.toLowerCase().includes(searchStr)
    );
  }

  return res.json(feedbacks);
});

// 4. Update Complaint Status (Admin Module)
app.put('/api/feedback/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Pending', 'In Progress', 'Resolved'].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const feedbacks = readFeedbacks();
  const feedbackIndex = feedbacks.findIndex(f => f.id === id);

  if (feedbackIndex === -1) {
    return res.status(404).json({ error: "Feedback record not found" });
  }

  feedbacks[feedbackIndex].status = status as 'Pending' | 'In Progress' | 'Resolved';
  writeFeedbacks(feedbacks);

  return res.json({ 
    success: true, 
    message: `Status updated to '${status}' successfully!`,
    data: feedbacks[feedbackIndex] 
  });
});

// 5. Delete Feedback Record (Admin Module)
app.delete('/api/feedback/:id', (req, res) => {
  const { id } = req.params;
  const feedbacks = readFeedbacks();
  const initialLength = feedbacks.length;
  const filteredFeedbacks = feedbacks.filter(f => f.id !== id);

  if (filteredFeedbacks.length === initialLength) {
    return res.status(404).json({ error: "Feedback record not found" });
  }

  writeFeedbacks(filteredFeedbacks);
  return res.json({ success: true, message: "Feedback record deleted successfully!" });
});

// Setup Vite Dev Server / Serve Production Static Files
async function startServer() {
  initDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();

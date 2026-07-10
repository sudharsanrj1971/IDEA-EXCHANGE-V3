const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 5000;

// In-memory data store for local mock run
const users = [];
const projects = [];

app.use(express.json());
app.use(cookieParser());

// Mock CSRF middleware (just calls next)
app.use((req, res, next) => {
  next();
});

// Mock Auth API
app.get('/api/v1/auth/csrf-token', (req, res) => {
  res.json({ success: true, data: { csrfToken: 'mock-csrf-token' } });
});

app.get('/api/v1/auth/config', (req, res) => {
  // Return empty string — Google button auto-hides when no valid Client ID is set
  // To enable Google Sign-In locally, replace '' with your real Google OAuth Client ID
  res.json({ success: true, data: { googleClientId: process.env.OAUTH_GOOGLE_CLIENT_ID || '' } });
});

app.post('/api/v1/auth/register', (req, res) => {
  const { email, name, role } = req.body;
  if (!email || !name) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }
  const newUser = { _id: 'mock-user-' + Date.now(), institutionalEmail: email, name, role: role || 'student' };
  users.push(newUser);
  res.status(201).json({ success: true, data: { user: newUser } });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email } = req.body;
  let user = users.find(u => u.institutionalEmail === email);
  if (!user) {
    user = { _id: 'mock-user-' + Date.now(), institutionalEmail: email, name: 'Local Test User', role: 'student' };
    users.push(user);
  }
  res.cookie('accessToken', 'mock-access-token', { httpOnly: true });
  res.json({ success: true, data: { user } });
});

// Mock Google OAuth endpoint — verifies credential format then returns user
app.post('/api/v1/auth/google', (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ success: false, message: 'Missing Google credential' });

  // In real production this verifies with Google's tokeninfo API
  // For local mock, we just create/return a user directly
  const mockGoogleUser = {
    _id: 'google-user-' + Date.now(),
    name: 'Google User',
    institutionalEmail: 'googleuser@gmail.com',
    role: 'student',
    reputationPoints: 0,
    isActive: true
  };

  // Avoid duplicates
  const existing = users.find(u => u.institutionalEmail === mockGoogleUser.institutionalEmail);
  const user = existing || mockGoogleUser;
  if (!existing) users.push(user);

  res.cookie('accessToken', 'mock-google-access-token', { httpOnly: true });
  res.json({ success: true, data: { user } });
});

app.get('/api/v1/users/me', (req, res) => {
  // Return a dummy logged-in user so the page loads
  const user = users[0] || { _id: 'mock-user-1', name: 'Developer User', institutionalEmail: 'dev@university.edu', role: 'student' };
  res.json({ success: true, data: { user } });
});

// Mock Projects API
app.get('/api/v1/projects', (req, res) => {
  res.json({ success: true, data: { projects, total: projects.length, pages: 1 } });
});

app.post('/api/v1/projects', (req, res) => {
  const { title, problemStatement, techStack } = req.body;
  const newProject = {
    _id: 'mock-project-' + Date.now(),
    title,
    problemStatement,
    techStack,
    ownerId: { name: 'Developer User' },
    state: 'SUBMITTED',
    collaborators: [],
    impactScore: 0,
    isActive: true,
    createdAt: new Date()
  };
  projects.push(newProject);
  res.status(201).json({ success: true, data: { project: newProject } });
});

// Serve frontend static build files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 [MOCK SERVER] Running locally on http://localhost:${PORT}`);
  console.log(`⚡ Both Frontend and Backend APIs are fully active (No database required!)`);
  console.log(`🔑 Google Sign-in button is now enabled for display.`);
});

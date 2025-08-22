// Elderly Companion AI - Full Backend (Groq + Upload + Register)

const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');

// ✅ Fix fetch for Node.js using dynamic import
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = 3000;
const GROQ_API_KEY =  // Your real key

// Middleware
app.use(express.static(__dirname));
app.use(bodyParser.json());
const upload = multer({ dest: 'uploads/' });

// Save user data
const usersFile = 'users.json';
app.post('/save-user', (req, res) => {
  const user = req.body;
  let users = [];
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile));
  }
  users.push(user);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.sendStatus(200);
});

// Get user data
app.get('/get-users', (req, res) => {
  if (fs.existsSync(usersFile)) {
    const users = JSON.parse(fs.readFileSync(usersFile));
    res.json(users);
  } else {
    res.json([]);
  }
});

// Handle medical file upload
app.post('/upload', upload.single('report'), (req, res) => {
  res.send('<h2>✅ Report Uploaded Successfully</h2><a href="/">Go Back</a>');
});

// ✅ Groq Chat Endpoint
app.post('/chat', async (req, res) => {
  const message = req.body.message;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: 'You are a friendly elderly AI companion.' },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Groq API error:', data);
      return res.status(500).json({ reply: 'AI error. Please check your API key or model.' });
    }

    const aiReply = data.choices?.[0]?.message?.content || '🤖 Sorry, no AI response.';
    res.json({ reply: aiReply });

  } catch (err) {
    console.error('❌ Server fetch failed:', err);
    res.status(500).json({ reply: 'Server error. Please try again.' });
  }
});

// Start the server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

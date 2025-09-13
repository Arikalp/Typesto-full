// index.js
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("./models/usermodal");
const app = express();
const PORT = 5000;
const JWT_SECRET = "supersecret";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini AI
console.log('GEMINI_API_KEY loaded:', GEMINI_API_KEY ? 'Yes' : 'No');
console.log('API Key length:', GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Rate limiting
let lastApiCall = 0;
const API_COOLDOWN = 5000; // 5 seconds between calls 

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/typesto", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err));

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


// -------------------- AUTH MIDDLEWARE --------------------
function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// -------------------- ROUTES --------------------

// SIGNUP
app.post("/api/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ error: "Email already registered" });

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername)
      return res.status(400).json({ error: "Username already taken" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.json({ message: "User created successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    // Generate token
    const token = jwt.sign({ id: user._id, username: user.username, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, { httpOnly: true });
    res.json({ message: "Login successful!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGOUT
app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully!" });
});

// PROTECTED ROUTE
app.get("/api/profile", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

// SMART WORD GENERATION
app.post("/api/generate-words", async (req, res) => {
  try {
    const { difficulty, accuracy, wpm, errors, wordCount } = req.body;
    
    // Check if API key is available
    if (!GEMINI_API_KEY) {
      console.error('Gemini API key not found');
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    // Rate limiting check
    const now = Date.now();
    if (now - lastApiCall < API_COOLDOWN) {
      console.log('API call blocked due to rate limiting');
      return res.status(429).json({ error: 'Rate limit exceeded, please wait' });
    }
    lastApiCall = now;
    
    console.log('Making Gemini API request with key:', GEMINI_API_KEY.substring(0, 10) + '...');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    let prompt = `Generate exactly ${wordCount} words for a typing test with these requirements:
- Difficulty: ${difficulty}
- User's current accuracy: ${accuracy}%
- User's current WPM: ${wpm}
- Recent errors: ${errors}

`;
    
    if (difficulty === 'easy') {
      prompt += "Generate simple 3-5 letter common words that are easy to type.";
    } else if (difficulty === 'medium') {
      prompt += "Generate 5-8 letter words with moderate complexity.";
    } else if (difficulty === 'hard') {
      prompt += "Generate complex 8+ letter words with challenging letter combinations.";
    } else if (difficulty === 'alphanumeric') {
      prompt += "Generate programming-related terms, function calls, and code snippets.";
    }
    
    if (accuracy < 85) {
      prompt += " Focus on words with letters the user might find challenging based on their accuracy.";
    }
    
    prompt += " Return only the words separated by commas, no explanations.";
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const words = text.split(',').map(word => word.trim()).filter(word => word.length > 0);
    
    res.json({ words: words.slice(0, wordCount) });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Failed to generate words' });
  }
});

// LEADERBOARD
app.get("/api/leaderboard", (req, res) => {
  const mockLeaderboards = {
    easy: [
      { _id: '1', username: 'SpeedTyper', wpm: 85, accuracy: 98, date: new Date() },
      { _id: '2', username: 'FastFingers', wpm: 82, accuracy: 96, date: new Date() },
      { _id: '3', username: 'QuickKeys', wpm: 78, accuracy: 94, date: new Date() },
    ],
    medium: [
      { _id: '4', username: 'TypeMaster', wpm: 72, accuracy: 97, date: new Date() },
      { _id: '5', username: 'KeyboardKing', wpm: 68, accuracy: 95, date: new Date() },
      { _id: '6', username: 'TypingPro', wpm: 65, accuracy: 93, date: new Date() },
    ],
    hard: [
      { _id: '7', username: 'WordWizard', wpm: 58, accuracy: 96, date: new Date() },
      { _id: '8', username: 'LetterLord', wpm: 55, accuracy: 94, date: new Date() },
      { _id: '9', username: 'TextTitan', wpm: 52, accuracy: 92, date: new Date() },
    ],
    alphanumeric: [
      { _id: '10', username: 'CodeTyper', wpm: 45, accuracy: 98, date: new Date() },
      { _id: '11', username: 'DevSpeed', wpm: 42, accuracy: 96, date: new Date() },
      { _id: '12', username: 'SyntaxSpeedy', wpm: 38, accuracy: 94, date: new Date() },
    ]
  };
  res.json(mockLeaderboards);
});

// -------------------- SERVER --------------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

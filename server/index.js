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
const Leaderboard = require("./models/leaderboardmodal");
const app = express();
const PORT = 5000;
const JWT_SECRET = "supersecret";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini AI
console.log('GEMINI_API_KEY loaded:', GEMINI_API_KEY ? 'Yes' : 'No');
// console.log('API Key length:', GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Rate limiting
let lastApiCall = 0;
const API_COOLDOWN = 5000; // 5 seconds between calls 

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/typesto", {
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
      expiresIn: "1d",
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

// Get leaderboard
app.get("/api/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Leaderboard.findOne();
    if (!leaderboard) {
      // Create initial leaderboard if it doesn't exist
      const newLeaderboard = new Leaderboard({
        easy: [],
        medium: [],
        hard: [],
        alphanumeric: []
      });
      await newLeaderboard.save();
      return res.json(newLeaderboard);
    }
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// Update leaderboard
app.post("/api/leaderboard", async (req, res) => {
  try {
    const { difficulty, username, wpm } = req.body;
    
    if (!difficulty || !username || !wpm) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let leaderboard = await Leaderboard.findOne();
    
    if (!leaderboard) {
      // Create new leaderboard
      leaderboard = new Leaderboard({
        easy: [],
        medium: [],
        hard: [],
        alphanumeric: []
      });
    }

    // Get current difficulty array
    let difficultyArray = leaderboard[difficulty] || [];
    
    // Check if user already exists in leaderboard
    const existingIndex = difficultyArray.findIndex(entry => entry.username === username);
    
    if (existingIndex !== -1) {
      // Update existing user's score if new score is higher
      if (wpm > difficultyArray[existingIndex].wpm) {
        difficultyArray[existingIndex].wpm = wpm;
      }
    } else {
      // Add new user
      difficultyArray.push({ username, wpm });
    }
    
    // Sort by WPM (highest first) and keep only top 5
    difficultyArray.sort((a, b) => b.wpm - a.wpm);
    difficultyArray = difficultyArray.slice(0, 5);
    
    // Update leaderboard
    leaderboard[difficulty] = difficultyArray;
    await leaderboard.save();
    
    res.json({ message: "Leaderboard updated!", leaderboard });
  } catch (error) {
    res.status(500).json({ error: "Failed to update leaderboard" });
  }
});

// -------------------- SERVER --------------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

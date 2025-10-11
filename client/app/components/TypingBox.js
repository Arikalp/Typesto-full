"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { FaBeer, FaUserCircle } from "react-icons/fa";
import { wordsData } from "../data/wordsList";
import Leaderboard from "./Leaderboard";
import { ShootingStars } from "@/components/ui/shooting-stars";

export default function TypingBox() {
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [finalWpm, setFinalWpm] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(100);
  const [correctChars, setCorrectChars] = useState(0);
  const [errors, setErrors] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [showDropdown, setShowDropdown] = useState(false);
  const [bestSpeed, setBestSpeed] = useState(0);
  const [difficulty, setDifficulty] = useState("medium");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [sessionStats, setSessionStats] = useState({ wpm: 0, accuracy: 100, errors: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [username, setUsername] = useState('');
  const [wordCount, setWordCount] = useState(45);

  // Refs for current values
  const wordsRef = useRef(words);
  const currentWordIndexRef = useRef(currentWordIndex);
  const currentCharIndexRef = useRef(currentCharIndex);
  const startTimeRef = useRef(startTime);
  const correctCharsRef = useRef(correctChars);
  const errorsRef = useRef(errors);

  useEffect(() => {
    wordsRef.current = words;
    currentWordIndexRef.current = currentWordIndex;
    currentCharIndexRef.current = currentCharIndex;
    startTimeRef.current = startTime;
    correctCharsRef.current = correctChars;
    errorsRef.current = errors;
  }, [words, currentWordIndex, currentCharIndex, startTime, correctChars, errors]);

  const generateSmartWords = useCallback(async () => {
    const wordCounts = { easy: 75, medium: 45, hard: 28, 2: 25 };
    const wordCount = wordCounts[difficulty];
    try {
      const response = await fetch("/api/generate-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          difficulty,
          accuracy: sessionStats.accuracy,
          wpm: sessionStats.wpm,
          errors: sessionStats.errors,
          wordCount,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.words;
      }
    } catch (err) {
      console.error("Smart word generation failed:", err);
    }
    const list = wordsData[difficulty];
    return Array.from({ length: wordCount }, () => list[Math.floor(Math.random() * list.length)]);
  }, [difficulty, sessionStats]);

  const newGame = useCallback(async () => {
    if (isGenerating) return; // prevent concurrent calls
    setIsGenerating(true);
    try {
      console.log("Generating words for difficulty:", difficulty, "Word count:", wordCount);

      let newWords;
      
      // Use smart generation if user has previous session data
      if (sessionStats.wpm > 0 || sessionStats.errors > 0) {
        try {
          const response = await fetch('/api/generate-words', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              difficulty,
              accuracy: sessionStats.accuracy,
              wpm: sessionStats.wpm,
              errors: sessionStats.errors,
              wordCount
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            newWords = data.words;
            console.log('Smart words generated:', newWords.length);
          } else {
            throw new Error('API response not ok');
          }
        } catch (error) {
          console.log('Smart generation failed, using static words:', error.message);
          // Fallback to static words
          const list = wordsData[difficulty];
          newWords = Array.from({ length: wordCount }, () => list[Math.floor(Math.random() * list.length)]);
        }
      } else {
        // First game - use static words
        const list = wordsData[difficulty];
        newWords = Array.from({ length: wordCount }, () => list[Math.floor(Math.random() * list.length)]);
      }

      setWords(newWords);
      setCurrentWordIndex(0);
      setCurrentCharIndex(0);
      setStartTime(null);
      setWpm(0);
      // Don't reset finalWpm and finalAccuracy - keep previous session values
      setCorrectChars(0);
      setErrors(0);
      setAccuracy(100);
      setSessionCompleted(false);
    } finally {
      setIsGenerating(false);
    }
  }, [difficulty, sessionStats, wordCount]);

  const calculateWpm = useCallback(() => {
    if (!startTimeRef.current) return 0;
    const minutes = (Date.now() - startTimeRef.current) / 60000;
    if (minutes <= 0) return 0;
    
    // Net WPM = (Total Characters Typed - Errors) / 5 / Time in Minutes
    // This is more accurate as it penalizes errors
    const totalCharsTyped = correctCharsRef.current + errorsRef.current;
    const netWpm = Math.max(0, Math.round((totalCharsTyped - errorsRef.current) / 5 / minutes));
    
    return netWpm;
  }, []);

  useEffect(() => {
    newGame();
    // Fetch username
    const fetchUsername = async () => {
      try {
        const response = await fetch('/api/profile', {
          method: 'GET',
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setUsername(userData.username);
        }
      } catch (error) {
        console.error('Error fetching username:', error);
      }
    };
    fetchUsername();
  }, []);

  useEffect(() => {
    newGame();
  }, [difficulty, newGame]);

  useEffect(() => {
    if (words.length > 0 && currentWordIndex >= words.length && !isGenerating && !sessionCompleted) {
      setSessionCompleted(true);
      // Advanced WPM calculation using multiple methods
      const minutes = (Date.now() - startTimeRef.current) / 60000;
      const totalCharsTyped = correctChars + errors;
      
      // Method 1: Net WPM (penalizes errors)
      const netWpm = Math.max(0, Math.round((correctChars / 5) / minutes));
      
      // Method 2: Gross WPM (total typing speed)
      const grossWpm = Math.round((totalCharsTyped / 5) / minutes);
      
      // Method 3: Adjusted WPM (considers error penalty)
      const errorPenalty = Math.min(errors * 0.5, grossWpm * 0.3); // Max 30% penalty
      const adjustedWpm = Math.max(0, Math.round(grossWpm - errorPenalty));
      
      // Use Net WPM as it's the most standard and accurate
      const completedWpm = netWpm;
      
      const acc = totalCharsTyped > 0 ? Math.round((correctChars / totalCharsTyped) * 100) : 100;
      
      console.log(`WPM Calculations - Net: ${netWpm}, Gross: ${grossWpm}, Adjusted: ${adjustedWpm}, Final: ${completedWpm}`);
      setFinalWpm(completedWpm);
      setFinalAccuracy(acc);
      if (completedWpm > bestSpeed) setBestSpeed(completedWpm);
      setSessionStats({ wpm: completedWpm, accuracy: acc, errors });

      // Update leaderboard for all difficulties
      const updateLeaderboard = async () => {
        try {
          // Get current user info first
          const userResponse = await fetch('/api/profile', {
            method: 'GET',
            credentials: 'include'
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            
            const response = await fetch('/api/leaderboard', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ 
                difficulty, 
                username: userData.username, 
                wpm: completedWpm 
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('Leaderboard updated:', result.message);
            } else {
              console.error('Failed to update leaderboard:', response.status);
            }
          }
        } catch (error) {
          console.error('Error updating leaderboard:', error);
        }
      };
      updateLeaderboard();

      setTimeout(() => {
        setSessionCompleted(false);
        if (!isGenerating) newGame();
      }, 1000);
    }
  }, [currentWordIndex, words.length, newGame, calculateWpm, bestSpeed, correctChars, errors, isGenerating, sessionCompleted]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.key === "Shift") return;
      if (e.key === " ") e.preventDefault();
      const currentWords = wordsRef.current;
      const idx = currentWordIndexRef.current;
      const cIdx = currentCharIndexRef.current;
      if (!startTimeRef.current) {
        const now = Date.now();
        setStartTime(now);
        startTimeRef.current = now;
      }
      if (idx >= currentWords.length) return;
      const word = currentWords[idx];
      if (e.key === " ") {
        if (cIdx === word.length) {
          setCurrentWordIndex((p) => p + 1);
          setCurrentCharIndex(0);
        }
        return;
      }
      if (e.key === "Backspace") {
        if (cIdx > 0) {
          setCurrentCharIndex((p) => p - 1);
        } else if (idx > 0) {
          setCurrentWordIndex((p) => p - 1);
          setCurrentCharIndex(currentWords[idx - 1].length);
        }
        return;
      }
      if (e.key.length === 1) {
        if (cIdx >= word.length) return;
        if (e.key === word[cIdx]) {
          setCorrectChars((p) => p + 1);
          setCurrentCharIndex((p) => p + 1);
        } else {
          setErrors((p) => p + 1);
        }
      }
    },
    [calculateWpm]
  );

  useEffect(() => {
    const listener = (e) => handleKeyPress(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [handleKeyPress]);

  useEffect(() => {
    const outside = (e) => {
      if (showDropdown && !e.target.closest(".relative")) setShowDropdown(false);
    };
    document.addEventListener("click", outside);
    return () => document.removeEventListener("click", outside);
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) window.location.reload();
    } catch (e) {
      console.error("Logout error:", e);
    }
  };



  if (showLeaderboard) return <Leaderboard onClose={() => setShowLeaderboard(false)} />;

  return (
    <div className="min-h-screen w-full relative overflow-hidden" style={{ backgroundColor: "#000" }}>
      <ShootingStars />
      <main className="w-[70vw] h-[80vh] mx-auto pt-[5vh] relative z-10">
        <h1 id="title" className="text-center text-yellow-400 font-bold text-[3.5vw]">Typesto</h1>
        <div id="header" className="grid grid-cols-3 mb-[5vh]">
          <div id="speed" className="text-yellow-400 flex items-center text-xl">Typing Speed: {finalWpm} WPM</div>
          <div id="accuracy" className="text-green-400 flex text-xl justify-center items-center">Accuracy: {finalAccuracy}%</div>
          <div id="button" className="text-right flex justify-end gap-4 relative">
            <button onClick={newGame} disabled={isGenerating} className="px-2 py-1 rounded bg-yellow-400 text-black text-lg hover:bg-yellow-700 hover:text-white transition">Refresh</button>
            <div className="relative">
              <button onClick={() => setShowDropdown(!showDropdown)} className="px-2 py-2 rounded-full bg-red-400 text-white text-lg hover:bg-yellow-700 hover:text-white transition flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-10 border border-gray-700">
                  <div className="py-1">
                    <div className="px-4 py-3 text-sm text-gray-300 border-b border-gray-700">
                      <div className="flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                        <span className="font-semibold text-white">{username || 'Loading...'}</span>
                      </div>
                    </div>
                    <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700 flex justify-center">
                      <div className="font-semibold">Best Speed :</div>
                      <div className="text-green-400">{bestSpeed} WPM</div>
                    </div>
                    <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                      <div className="font-semibold mb-2 text-center">Word Count:</div>
                      <input 
                        type="range" 
                        min="25" 
                        max="70" 
                        value={wordCount} 
                        onChange={(e) => setWordCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>25</span>
                        <span className="text-yellow-400 font-semibold">{wordCount}</span>
                        <span>70</span>
                      </div>
                    </div>
                    <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                      <div className="font-semibold flex justify-center  mb-2">Difficulty:</div>
                      {["easy", "medium", "hard", "alphanumeric"].map((level) => (
                        <button key={level} onClick={() => { setDifficulty(level); setShowDropdown(false); }} className={`block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-700 ${difficulty === level ? "bg-yellow-400 text-black" : "text-gray-300"}`}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => { setShowLeaderboard(true); setShowDropdown(false); }} className="block w-full flex justify-center bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-500 transition border-b border-gray-700">Leaderboard</button>
                    <button onClick={handleLogout} className="block w-full flex justify-center bg-red-700 text-white px-4 py-2 text-sm hover:bg-red-600 transition">Logout</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div id="game">
          <div id="words" className="flex flex-wrap justify-center gap-2 font-serif font-bold text-[2vw] text-gray-200 leading-relaxed">
            {words.map((word, wi) => {
              if (wi < currentWordIndex) return <span key={wi} className="text-gray-500 completed">{word}</span>;
              if (wi === currentWordIndex) {
                return (
                  <span key={wi} className="relative bg-gray-700 px-1 rounded">
                    <span className="text-green-500">{word.substring(0, currentCharIndex)}</span>
                    <span className="text-white underline">{word.substring(currentCharIndex, currentCharIndex + 1)}</span>
                    <span className="text-gray-400">{word.substring(currentCharIndex + 1)}</span>
                  </span>
                );
              }
              return <span key={wi} className="text-gray-400">{word}</span>;
            })}
          </div>
        </div>
        <div className="mt-8 text-center text-gray-400">
          <p>Start typing to begin. Press Space to move to the next word.</p>
        </div>
        <footer className="fixed bottom-4 left-0 w-full flex justify-center">
          <span className="text-white text-[1.2vw] bg-gray-800/70 px-6 py-2 rounded-xl">Developed with ❤️ by Sankalp</span>
        </footer>
      </main>
    </div>
  );
}

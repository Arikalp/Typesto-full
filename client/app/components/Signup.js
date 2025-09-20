"use client";
import React, { useState } from 'react';
import { BackgroundBoxes } from "@/components/ui/background-boxes";

const Signup = ({ switchToLogin, setUser }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    try {
      setError('');
      setSuccess('');
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Account created successfully! Please login.');
        setUser({ username, email });
        setTimeout(() => switchToLogin(), 2000);
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error(error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="h-screen relative w-full overflow-hidden bg-slate-900 flex flex-col items-center justify-center">
      <div className="absolute inset-0 w-full h-full bg-slate-900 z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
      <BackgroundBoxes />
      {/* Title */}
      <h1 className="relative z-20 text-center text-yellow-400 font-bold text-[4vw] mb-8 animate-pulse">
        Typesto
      </h1>
      
      <div className="relative z-20 bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700 mb-20">
        <h2 className="text-3xl font-bold mb-8 text-center text-yellow-400">Sign Up</h2>
        {error && <div className="mb-4 p-3 bg-red-900/50 text-red-300 rounded-lg text-sm border border-red-700">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-900/50 text-green-300 rounded-lg text-sm border border-green-700">{success}</div>}
        
        <input
          className="w-full mb-4 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white placeholder-gray-400 transition"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Username"
        />
        
        <input
          className="w-full mb-4 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white placeholder-gray-400 transition"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
        />
        
        <div className="relative mb-6">
          <input
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white placeholder-gray-400 pr-12 transition"
            value={password}
            onChange={e => setPassword(e.target.value)}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-yellow-400 transition"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        
        <button
          className="w-full bg-yellow-400 text-black py-3 rounded-lg hover:bg-yellow-500 transition font-semibold mb-4 transform hover:scale-105"
          onClick={handleSignup}
        >
          Sign Up
        </button>
        
        <div className="text-center">
          <p className="text-gray-300 mb-3">Already have an account?</p>
          <button 
            onClick={switchToLogin}
            className="text-yellow-400 hover:text-yellow-300 font-medium underline transition"
          >
            Login
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="relative z-20 absolute bottom-4 left-0 w-full flex justify-center">
        <span className="text-white text-lg bg-gray-800/70 px-6 py-2 rounded-xl">
          Developed with ❤️ by Sankalp
        </span>
      </footer>
    </div>
  );
}

export default Signup;
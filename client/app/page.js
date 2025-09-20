"use client"
import React, { useState } from 'react';
import Login from './components/login';
import Signup from './components/Signup';
import TypingBox from './components/TypingBox';

const Page = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    if (view === 'signup') return <Signup switchToLogin={() => setView('login')} setUser={setUser} />;
    return <Login switchToSignup={() => setView('signup')} setUser={setUser} />;
  }

  // Show TypingBox after login/signup
  return (
    <TypingBox user={user} onLogout={handleLogout} />
  );
};

export default Page;

"use client";
import { useState, useEffect } from "react";

export default function Leaderboard({ onClose }) {
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('easy');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 text-white p-8 rounded-lg max-w-md w-full mx-4">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white p-8 rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-yellow-400">🏆 Leaderboard</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-4 bg-gray-900 rounded-lg p-1">
          {[
            { key: 'easy', label: '🟢 Easy', color: 'text-green-400' },
            { key: 'medium', label: '🟡 Medium', color: 'text-yellow-400' },
            { key: 'hard', label: '🔴 Hard', color: 'text-red-400' },
            { key: 'alphanumeric', label: '🔢 Alpha', color: 'text-purple-400' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
                activeTab === tab.key 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className={tab.color}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-700 p-4 rounded-lg min-h-[300px]">
          {leaderboard && leaderboard[activeTab] && (
            <>
              <h3 className={`font-semibold mb-4 text-lg ${
                activeTab === 'easy' ? 'text-green-400' :
                activeTab === 'medium' ? 'text-yellow-400' :
                activeTab === 'hard' ? 'text-red-400' : 'text-purple-400'
              }`}>
                {activeTab === 'easy' ? '🟢 Easy Mode' :
                 activeTab === 'medium' ? '🟡 Medium Mode' :
                 activeTab === 'hard' ? '🔴 Hard Mode' : '🔢 Alphanumeric Mode'} - Top 5
              </h3>
              
              {leaderboard[activeTab].length > 0 ? (
                <div className="space-y-3">
                  {leaderboard[activeTab].map((entry, index) => (
                    <div key={index} className={`flex justify-between items-center p-3 rounded ${
                      index === 0 ? 'bg-yellow-900/30 border border-yellow-600/50' :
                      index === 1 ? 'bg-gray-600/50' :
                      index === 2 ? 'bg-orange-900/30' : 'bg-gray-800/50'
                    }`}>
                      <div className="flex items-center">
                        <span className={`text-lg font-bold mr-3 ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-400' : 'text-gray-400'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                        <span className="font-medium text-white">{entry.username}</span>
                      </div>
                      <span className="text-yellow-400 font-bold">{entry.wpm} WPM</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🏆</div>
                  <p className="text-gray-400">No records yet</p>
                  <p className="text-gray-500 text-sm mt-2">Be the first to set a record!</p>
                </div>
              )}
            </>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-yellow-400 text-black py-2 rounded hover:bg-yellow-500 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
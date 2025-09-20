const mongoose = require("mongoose")

const leaderboardSchema = new mongoose.Schema({
    easy: [{
        username: String,
        wpm: Number
    }],
    medium: [{
        username: String,
        wpm: Number
    }],
    hard: [{
        username: String,
        wpm: Number
    }],
    alphanumeric: [{
        username: String,
        wpm: Number
    }]
})

const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema)
module.exports = Leaderboard;

const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
    username: {
        type: String, 
        trim: true, 
    }, 
    email: {
        type: String, 
        trim: true, 
    }, 
    password: {
        type: String, 
        trim:true, 
    }, 
    socketID: {
        type: String, 
    }
}) 

const Player = mongoose.model("Player", playerSchema);

module.exports = {playerSchema, Player};
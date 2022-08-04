const mongoose = require("mongoose");
const playerSchema = require("player");

const roomSchema = new mongoose.Schema({
    roomID: {
        type: String, 
    }, 
    redPlayer: [playerSchema], 
    blackPlayer: [playerSchema], 
    turn: playerSchema, 
    
})

module.exports = roomSchema;
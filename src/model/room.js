const { playerSchema } = require("./playerDB");

class Room {
    static index = 0;
    roomID;
    redPlayers = [];
    blackPlayers = [];

    constructor() {
        this.roomID = Room.index;
        Room.index++;
    }

    joinable() {
        return (this.redPlayers.length + this.blackPlayers.length) < 2;
    }

    joinRoom(player) {
        if (this.redPlayers.length == 0) {
            this.redPlayers.push(player);
        } else if (this.blackPlayers.length == 0) {
            this.blackPlayers.push(player);
        }
    }

    leaveRoom(player) {
        if (this.redPlayers.includes(player)) {
            this.redPlayers.filter((element) => {
                element != player;
            });
        } else if (this.blackPlayers.includes(player)){
            this.blackPlayers.filter((element) => {
                element != player;
            });
        }
    }
}

module.exports = Room;
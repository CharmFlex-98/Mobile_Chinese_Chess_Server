const { playerSchema } = require("./playerDB");

const RoomStatus = {
    "allNotReady": 0, 
    "redReady": 1, 
    "blackReady": 2,
    "allReady": 3 
}

class Room {
    static index = 0;
    roomID;
    redPlayers = [];
    blackPlayers = [];
    roomStatus = RoomStatus.allNotReady;
    isRedTurn = true;

    constructor() {
        this.roomID = Room.index;
        Room.index++;
    }

    redPlayer() {
        return this.redPlayers[0];
    }

    blackPlayer() {
        return this.blackPlayers[0];
    }

    // check if a player is in red team or not, else the player in black team.
    isRedTeam(socket) {
        return this.redPlayer()["socketID"] == socket.id;
    }
    

    joinable() {
        return this.playerCount() < 2;
    }

    playerCount() {
        return this.redPlayers.length + this.blackPlayers.length;
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
            this.redPlayers = this.redPlayers.filter((element) => {
                return element != player;
            });
        } else if (this.blackPlayers.includes(player)){
            this.blackPlayers = this.blackPlayers.filter((element) => {
                return element != player;
            });
        }
    }

    isReady(isRed) {
        if ((isRed && this.roomStatus == RoomStatus.blackReady) || (!isRed && this.roomStatus == RoomStatus.redReady)) {
            console.log("what");
            this.roomStatus = RoomStatus.allReady;
        } else {
            this.roomStatus = isRed ? RoomStatus.redReady : RoomStatus.blackReady;
        }
        console.log(this.roomStatus);
    }

    allowEnterGame() {
        return this.roomStatus == RoomStatus.allReady;
    }

    changeTurn() {
        this.isRedTurn = !this.isRedTurn;
    }

    resetRoomStatus() {
        this.roomStatus = RoomStatus.allNotReady;
    }


}

module.exports = Room;
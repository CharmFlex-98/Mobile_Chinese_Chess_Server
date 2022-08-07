class Player {
    username;
    socketID;

    constructor(username, socketID) {
        this.username = username;
        this.socketID = socketID; 
    }
}

module.exports = Player;
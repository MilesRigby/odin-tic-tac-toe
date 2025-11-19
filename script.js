// players - 1: noughts; 2: crosses; 0: game ended

// Events:
// start_game
// player_move
// player_won
// stalemate
// player_turn_end

// UI events:
// gridspace_clicked
// board_state_update
// player_turn_update

// A simple event system found on YouTube channel LearnCode.academy, video:
// "Modular Javascript #4 - PubSub Javascript Design Pattern", found through The Odin Project
var events = {
    events: {},
    on: function (eventName, fn) {
        this.events[eventName] = this.events[eventName] || [];
        this.events[eventName].push(fn);
    },
    emit: function (eventName, data) {
        if (this.events[eventName]) {
            console.log(eventName);
            this.events[eventName].forEach(function(fn) {
                fn(data);
            })
        }
    }
};



// Defines the 3*3 gameboard as well as functions for manipulating and modifying the board
const gameBoard = (function() {

    let state = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

    // Initialises the game state for a new round
    events.on("start_game", function() {
        state = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        events.emit("board_state_update", state);
    })

    // Validates a player move is allowed, and emits signals to indicate board changes and whether the player has won
    events.on("player_move", function(data) {
        ( {player, position} = data );

        if ( !state[position[0]][position[1]] ) { 
            state[position[0]][position[1]] = player; 
            events.emit("board_state_update", state);

            if      (_playerWon())   { events.emit("player_won", player); }
            else if (_isStalemate()) { events.emit("stalemate"); }
            else                     { events.emit("player_turn_end"); }
        }
    })

    // Uses the board state to determine if either player has won by checking every row, column, and diagonal of 3 on the game board
    function _playerWon() {

        // Equal x (vertical lines)
        for (x=0; x<3; x++) {
            if (state[x][0] && state[x][0] == state[x][1] && state[x][1] == state[x][2]) {
                return true;
            }
        }

        // Equal y (horizontal lines)
        for (y=0; y<3; y++) {
            if (state[0][y] && state[0][y] == state[1][y] && state[1][y] == state[2][y]) {
                return true;
            }
        }

        // y=x (first diagonal)
        if (state[0][0] && state[0][0] == state[1][1] && state[1][1] == state[2][2]) {
            return true;
        }

        // y+x=2 (second diagonal)
        if (state[0][2] && state[0][2] == state[1][1] && state[1][1] == state[2][0]) {
            return true;
        }

        return false;
    }

    function _isStalemate() {
        for (x=0; x<3; x++) {
            for (y=0; y<3; y++) {
                if (!state[x][y]) { return false; }
            }
        }
        return true;
    }
})();



// Keeps track of the current player turn, and handles events dependant on or affecting the current turn
const turnHandler = (function() {

    // Tracks whose turn it currently is - 1: noughts, 2: crosses; 0: game end
    let playerTurn;

    // Event to be emitted by html elements when clicked, triggering the player_move event with the player who's turn it currently is
    events.on("gridspace_clicked", function(position) {
        if (playerTurn){
            events.emit("player_move", {player: playerTurn, position})
        }
    })

    // When a player's turn ends, updates the current player turn and emits the new active turn
    events.on("player_turn_end", function() {
        playerTurn = 3 - playerTurn // flips 1 <-> 2
        events.emit("player_turn_update", playerTurn);
    })

    // Noughts go first
    events.on("start_game", function() {
        playerTurn = 1;
        events.emit("player_turn_update", playerTurn);
    });

    // On game end, prevent players from going
    events.on("player_won", function() {
        playerTurn = 0;
    })

})();



// Below are UI components

// Tracks player names for display
const playerNameTracker = (function() {

    const playerNames = {
        1: "Player O",
        2: "Player X",
    };

    events.on("player_name_change", function({player, newName}) {
        playerNames[player] = newName;
    });

    function getPlayerName(player) {
        return playerNames[player];
    }

    return {
        getPlayerName: getPlayerName,
    };

})();



// Manages the 3*3 display in index.html, diplsaying the current state of the board
const boardHandler = (function() {

    const uiBoard = document.querySelectorAll(".board-token");

    uiBoard.forEach((token, index) => {
        token.addEventListener("click", () => {
            events.emit("gridspace_clicked", [index % 3, Math.floor(index/3.0)]);
        });
    });

    events.on("board_state_update", function(state) {
        for(x=0; x<3; x++) {
            for(y=0; y<3; y++) {
                token = x + 3*y;
                if      (state[x][y] == 1) { uiBoard[token].innerText = "O"; }
                else if (state[x][y] == 2) { uiBoard[token].innerText = "X"; }  
                else                       { uiBoard[token].innerText = ""; }  
            }
        }
    });

})();



// Handler for the player turn display
const turnDispHandler = (function() {

    let turnDisplay = document.querySelector(".player-turn");
    let whoseName = 1;

    events.on("player_turn_update", function(player) {
        turnDisplay.innerText = playerNameTracker.getPlayerName(player) + "'s Turn";
        whoseName = player;
    });

    events.on("player_name_change", function({player, newName}) {
        if (whoseName == player) { turnDisplay.innerText = newName + "'s Turn"; }
    });

})();



// Handler for the modal that tells the players when someone wins
const victoryModalHandler = (function() {

    const victoryModal = document.querySelector(".victory-modal");

    events.on("player_won", function(player) {
        victoryModal.textContent = playerNameTracker.getPlayerName(player) + " Won!";
        victoryModal.style = "visibility: visible";
    });

    events.on("stalemate", function(player) {
        victoryModal.textContent = "Stalemate!";
        victoryModal.style = "visibility: visible";
    });

    events.on("start_game", function() {
        victoryModal.style = "visibility: hidden";
    });

})();



// Game restart button
const restartButtonManager = (function() {

    const restartButton = document.querySelector(".restart-button");

    restartButton.addEventListener("click", () => {
        events.emit("start_game");
    });

})();



// Handles changing names of players through forms
const nameFormManager = (function() {

    const p1NameForm = document.querySelector("#p1-form");
    const p2NameForm = document.querySelector("#p2-form");

    p1NameForm.addEventListener('submit', (e) => {
        e.preventDefault();
    
        const formData = new FormData(p1NameForm);
        const newName = formData.get('p1Name');
        events.emit("player_name_change", {player: 1, newName: newName})

        p1NameForm.reset();
    });

    p2NameForm.addEventListener('submit', (e) => {
        e.preventDefault();
    
        const formData = new FormData(p2NameForm);
        const newName = formData.get('p2Name');
        events.emit("player_name_change", {player: 2, newName: newName})

        p2NameForm.reset();
    });

})();



// Game initiation
events.emit("start_game")
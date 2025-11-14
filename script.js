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

// A simple event system copied from YouTube channel LearnCode.academy, video:
// "Modular Javascript #4 - PubSub Javascript Design Pattern", found through The Odin Project
var events = {
    events: {},
    on: function (eventName, fn) {
        this.events[eventName] = this.events[eventName] || [];
        this.events[eventName].push(fn);
    },
    emit: function (eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(function(fn) {
                fn(data);
            })
        }
    }
}



// Defines the 3*3 gameboard as well as functions for manipulating and modifying the board
const gameBoard = (function GameBoard() {

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

            if (_playerWon())   { events.emit("player_won", player); }
            else if (_isStalemate()) { events.emit("stalemate"); }
            else                { events.emit("player_turn_end"); }
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

    return state;

})()



// Keeps track of the current player turn, and handles events dependant on or affecting the current turn
const turnHandler = (function() {

    // Tracks whose turn it currently is - 1: noughts, 2: crosses
    let playerTurn = 1;

    // Event to be emitted by html elements when clicked, triggering the player_move event with the player who's turn it currently is
    events.on("gridspace_clicked", function(position) {
        events.emit("player_move", {player: playerTurn, position})
    })

    // When a player's turn ends, updates the current player turn and emits the new active turn
    events.on("player_turn_end", function() {
        playerTurn = 3 - playerTurn // flips 1 <-> 2
        events.emit("player_turn_update", playerTurn);
    })

})()



console.log(gameBoard);

events.on("board_state_update", function() {
    console.log(gameBoard);
})

events.on("stalemate", function() {
    console.log("Draw!");
})

events.on("player_won", function(player) {
    console.log("Player " + player.toString() + " wins!");
})
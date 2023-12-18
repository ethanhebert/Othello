/*
Ethan Hebert
10381833
11-13-23
Assignment 3 - Othello with Minimax and Alpha-Beta Pruning
This program implements a fully-functioning Othello board game made for 2 players as a web-based application.
A user can play another human or one of three AI's of increasing difficulty.
The first AI, C-3PO, chooses a next legal move at total random with no form of intelligence.
The second AI, Wall-E, utilizes a heuristic, minimax, and alpha-beta pruning to a shallow amount of layers to choose a next best move.
The third AI, HAL, utilizes a heuristic, minimax, and alpha-beta pruning to a deep amount of layers to choose a next best move.
A user can also watch 2 AI's play each other.
Extra tools can be utilized within the terminal in a browser.
*/

// CONSTANTS
// VALUES
const BOARDWIDTH = 8;
const BOARDHEIGHT = 8;
const AITIMEDELAY = 1500;
const WALLEDEPTH = 3;
const HALDEPTH = 6;
// HTML ELEMENTS
const boardGridEl = document.querySelector("#boardGrid");
const piecesGridEl = document.querySelector("#piecesGrid");
const startMenuEl = document.querySelector("#startMenu");
const playerSelectButtonsEl = document.querySelector("#playerSelectButtons");
// BOARD STATES AND PIECE OPTIONS
const pieceOptions = ["noPiece", "blackPiece", "whitePiece", "potentialBlackPiece", "potentialWhitePiece"];
const startBoardState = [
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,3,0,0,0,0],
    [0,0,3,2,1,0,0,0],
    [0,0,0,1,2,3,0,0],
    [0,0,0,0,3,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0]
];
const menuBoardState = [
    [3,2,4,1,3,2,4,1],
    [1,3,2,4,1,3,2,4],
    [4,1,3,2,4,1,3,2],
    [2,4,1,3,2,4,1,3],
    [3,2,4,1,3,2,4,1],
    [1,3,2,4,1,3,2,4],
    [4,1,3,2,4,1,3,2],
    [2,4,1,3,2,4,1,3]
];

// GLOBAL VARS
// CHOOSING PLAYER FOR EACH COLOR BUTTONS
let blackPlayerSelectEl = document.querySelector("#blackPlayerSelect");
let whitePlayerSelectEl = document.querySelector("#whitePlayerSelect");
let blackPlayer = "Human";
let whitePlayer = "Human";
// INITIAL BOARD
let boardState = deepCopyBoard(menuBoardState); // clone the array values, not a reference
let numBlackPieces = 2;
let numWhitePieces = 2;
let selectableBoard = false;
// INITIAL GAME STATE
let playerColor = 1;
let opponentColor = 2;
let playingGame = false;
// 8 directions around a piece on the board - starting at top then clockwise - for analyzing possible moves
let directions = [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];
// Stores all potential moves the next player can make - AI uses this to make a decision
let potentialMoves = [[2,3],[3,2],[4,5],[5,4]];

// Start up the board on load
createBoard();
updatePieces();

// Creates the square grid background board - just for looks
function createBoard() {
    boardGridEl.innerHTML = "";
    for (let row=1; row<=BOARDHEIGHT; row++) {
        for (let col=1; col<=BOARDWIDTH; col++) {
            boardGridEl.innerHTML += `
                <div class="boardSquare" style="grid-area: ${row}/${col}/span 1/span 1;"></div>
            `
        }
    }
}

// Visually updates the pieces on the board, including white, black, and potential moves for the next turn, as well as piece count
function updatePieces() {
    // reset counters to increment and display new values
    if (playingGame) {
        numBlackPieces = 0;
        numWhitePieces = 0;
    }
    piecesGridEl.innerHTML = "";
    for (let row=0; row<BOARDHEIGHT; row++) {
        for (let col=0; col<BOARDWIDTH; col++) {
            // draw the piece on the board
            piecesGridEl.innerHTML += `
                <div class="piece ${pieceOptions[boardState[row][col]]}" onclick="selectedPiece(${row},${col})" style="grid-area: ${row+1}/${col+1}/span 1/span 1;"></div>
            `;
            // increment counters
            if (playingGame) {
                // black
                if (boardState[row][col] == 1)
                    numBlackPieces++;
                // white
                else if (boardState[row][col] == 2)
                    numWhitePieces++;
            }
        }
    }
    // show the updated counters
    if (playingGame) {
        playerSelectButtonsEl.innerHTML = `
            <button class="playerSelect blackPiece">${numBlackPieces}</button>
            <button class="playerSelect whitePiece">${numWhitePieces}</button>
        `;
    }
}

// Cycle through potential player for black and white on button click - Human, C-3PO, Wall-E, or HAL
function flipPlayerSelect(color) {
    // figure out what color you're dealing with
    let colorPlayerSelectEl;
    if (color == "black")
        colorPlayerSelectEl = blackPlayerSelectEl;
    else
        colorPlayerSelectEl = whitePlayerSelectEl;

    // switch to next possible player in sequence
    switch (colorPlayerSelectEl.innerText) {
        case "Human":
            colorPlayerSelectEl.innerText = "C-3PO"
            break;
        case "C-3PO":
            colorPlayerSelectEl.innerText = "Wall-E"
            break;
        case "Wall-E":
            colorPlayerSelectEl.innerText = "HAL"
            break;
        case "HAL":
            colorPlayerSelectEl.innerText = "Human"
            break;
    };
}

// Start the game by loading up start board, assigning players, and allowing black to make first move
function startGame() {
    // record that you started game
    selectableBoard = true;
    playingGame = true;

    // assign players
    blackPlayer = blackPlayerSelectEl.innerText;
    whitePlayer = whitePlayerSelectEl.innerText;
    playerColor = 1;
    opponentColor = 2;

    // reset piece count and display and make the buttons unselectable
    numBlackPieces = 2;
    numWhitePieces = 2;
    playerSelectButtonsEl.innerHTML = `
        <button class="playerSelect blackPiece">${numBlackPieces}</button>
        <button class="playerSelect whitePiece">${numWhitePieces}</button>
    `;

    // switch button to menu
    startMenuEl.innerHTML = `<button id="startMenuButton" onclick="menu()">Main Menu</button>`;

    // load starting board
    boardState = deepCopyBoard(startBoardState);
    potentialMoves = [[2,3],[3,2],[4,5],[5,4]];
    updatePieces();

    // allow black to make first move, if AI pick first move at random
    if (getPlayerType() != "Human") {
        selectableBoard = false;
        let move = potentialMoves[Math.floor(Math.random()*potentialMoves.length)];
        setTimeout(selectedPiece, AITIMEDELAY, move[0], move[1]);
    }
}

// Go back to main menu, allowing user to choose players and start a new game
function menu() {
    // set to not playing game anymore
    selectableBoard = false;
    playingGame = false;

    // reset to menu players and selectable buttons
    playerSelectButtonsEl.innerHTML = `
        <button class="playerSelect blackPiece" id="blackPlayerSelect" onclick="flipPlayerSelect('black')">${blackPlayer}</button>
        <button class="playerSelect whitePiece" id="whitePlayerSelect" onclick="flipPlayerSelect('white')">${whitePlayer}</button>
    `;
    blackPlayerSelectEl = document.querySelector("#blackPlayerSelect");
    whitePlayerSelectEl = document.querySelector("#whitePlayerSelect");

    // switch button to start game
    startMenuEl.innerHTML = `<button id="startMenuButton" onclick="startGame()">Start Game</button>`;

    // load menu board
    boardState = deepCopyBoard(menuBoardState);
    updatePieces();
}

// Called whenever a piece is selected on the board, checks if legal selection and updates board from here
function selectedPiece(row,col) {
    // ignore touch when not playing game
    if (playingGame) {
        selectableBoard = true;
        // black player
        if (boardState[row][col] == 3) {
            playerColor = 1;
            opponentColor = 2;
        }
        // white player
        else if (boardState[row][col] == 4) {
            playerColor = 2;
            opponentColor = 1;
        }
        // selected illegal move, do nothing
        else
            return;

        // update board based on selection
        boardState = flipPieces(row,col,boardState);
        boardState = removePotentialPieces(boardState);
        [boardState, potentialMoves] = calculatePotentialMoves(boardState, false);
        updatePieces();

        // call next move
        let move, eval;
        switch (getPlayerType()) {
            case "Human":
                break;
            case "C-3PO":
                selectableBoard = false;
                move = potentialMoves[Math.floor(Math.random()*potentialMoves.length)];
                setTimeout(selectedPiece, AITIMEDELAY, move[0], move[1]);
                break;
            case "Wall-E":
                selectableBoard = false;
                [eval, move] = minimax([row,col], potentialMoves, deepCopyBoard(boardState), WALLEDEPTH, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, true);
                selectedPiece(move[0], move[1]);
                break;
            case "HAL":
                selectableBoard = false;
                [eval, move] = minimax([row,col], potentialMoves, deepCopyBoard(boardState), HALDEPTH, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, true);
                selectedPiece(move[0], move[1]);
                break;
        }
    }
    else
        gameOver();
}

// After player selects a piece placement, add this piece and flip any middle pieces
function flipPieces(row,col,board) {
    // fill in selected piece with player color
    board[row][col] = playerColor;
    
    // check to flip surrounding pieces
    for (d=0; d<directions.length; d++) {
        let piecesToFlip = [];
        let pieceInLine = 1;
        try {
            // see if the first piece in each direction is of the opposite color
            // if it is the opposite color, keep going this direction and saving the pieces to flip at the end
            while (board[row + pieceInLine*directions[d][0]][col + pieceInLine*directions[d][1]] == opponentColor) {
                piecesToFlip.push([row + pieceInLine*directions[d][0], col + pieceInLine*directions[d][1]]);
                pieceInLine++;
            }
            // you've gotten to the end, now flip all the middle pieces, or flip nothing if there are no middle pieces
            if (board[row + pieceInLine*directions[d][0]][col + pieceInLine*directions[d][1]] == playerColor) {
                for (piece=0; piece<piecesToFlip.length; piece++)
                    board[piecesToFlip[piece][0]][piecesToFlip[piece][1]] = playerColor;
            }
        } catch (error) {}
    }
    return board;
}

// Replaces all unselected potential pieces with a blank piece
function removePotentialPieces(board) {
    for (let row=0; row<BOARDHEIGHT; row++) {
        for (let col=0; col<BOARDWIDTH; col++) {
            if (board[row][col] == 3 || board[row][col] == 4)
                board[row][col] = 0;
        }
    }
    return board;
}

// Calculates potential moves based on the game state and fills in boardState with this data, potential moves displayed by hollow discs 
function calculatePotentialMoves(board, triedBothColors) {
    // swap current player to fill this color's potential pieces
    if (playerColor == 1) {
        playerColor = 2;
        opponentColor = 1;
    }
    else {
        playerColor = 1;
        opponentColor = 2;
    }

    // fill in all potential moves
    // go through whole board one piece at a time, if its the player color, check surrounding pieces
    let localPotentialMoves = [];
    for (let row=0; row<BOARDHEIGHT; row++) {
        for (let col=0; col<BOARDWIDTH; col++) {
            if (board[row][col] == playerColor) {
                // check surrounding pieces for opponent color
                for (d=0; d<directions.length; d++) {
                    let pieceInLine = 1;
                    try {
                        // see if the first piece in each direction is of the opposite color
                        // if it is the opposite color, keep going this direction until you find a no piece at the end
                        while (board[row + pieceInLine*directions[d][0]][col + pieceInLine*directions[d][1]] == opponentColor)
                            pieceInLine++;
                        // you've gotten to a no piece, now make this piece a potential piece
                        if (board[row + pieceInLine*directions[d][0]][col + pieceInLine*directions[d][1]] == 0 && pieceInLine>1) {
                            board[row + pieceInLine*directions[d][0]][col + pieceInLine*directions[d][1]] = playerColor+2;
                            localPotentialMoves.push([row + pieceInLine*directions[d][0], col + pieceInLine*directions[d][1]]);
                        }
                    } catch (error) {}
                }
            }
        }
    }

    // cant find any potential moves for this color, try swapping to the other color to give them another move
    // if they cant move and you're back here, call an end to the game
    if (localPotentialMoves.length == 0) {
        if (!triedBothColors)
            return calculatePotentialMoves(board, true);
        else
            playingGame = false;
    }
    return [board, localPotentialMoves];
}

// Returns the player type of the current player moving - Human, C-3PO, Wall-E, or HAL
function getPlayerType() {
    let playerType;
    if (playerColor == 1)
        playerType = blackPlayer;
    else
        playerType = whitePlayer;
    return playerType;
}

// Game over - display the winner and stop allowing moves
function gameOver() {
    // set to ended game
    selectableBoard = false;

    // black win
    if (numBlackPieces > numWhitePieces)
        playerSelectButtonsEl.innerHTML = `
            <button class="playerSelect blackPiece" id="blackWin">${numBlackPieces}</button>
            <button class="playerSelect whitePiece">${numWhitePieces}</button>
        `;
    // white win
    else if (numWhitePieces > numBlackPieces)
        playerSelectButtonsEl.innerHTML = `
            <button class="playerSelect blackPiece">${numBlackPieces}</button>
            <button class="playerSelect whitePiece" id="whiteWin">${numWhitePieces}</button>
        `;
    // tie
    else
        playerSelectButtonsEl.innerHTML = `
            <button class="playerSelect blackPiece" id="blackWin">${numBlackPieces}</button>
            <button class="playerSelect whitePiece" id="whiteWin">${numWhitePieces}</button>
        `;
}

// This allows resetting to menu or start board by deep copying the values of a double array (the board)
function deepCopyBoard(board) {
    let copy = [];
    for (row=0; row<board.length; row++) {
        let copyRow = [];
        for (col=0; col<board[0].length; col++)
            copyRow[col] = board[row][col];
        copy[row] = copyRow;
    }
    return copy;
}

// Implements minimax recursively down a specified number of layers to return the attractiveness of a move as an integer
// as well as the row and col of the move in an array
function minimax(move, children, board, depth, alpha, beta, maximizingPlayer) {
    console.log(move + " " + depth);
    console.log(board);
    // bottom of depth or leaf node, return heuristic
    if (depth == 0 || children.length == 0)
        return [heuristic(move, board), move];
    // This player wants a max
    if (maximizingPlayer) {
        let maxEval = Number.MIN_SAFE_INTEGER;
        let maxMove = [];
        // get the eval and move of each child
        for (child=0; child<children.length; child++) {
            let childBoard = deepCopyBoard(board);
            childBoard = flipPieces(children[child][0], children[child][1], childBoard);
            childBoard = removePotentialPieces(childBoard);
            [childBoard, grandchildren] = calculatePotentialMoves(childBoard, false);
            let [childEval, childMove] = minimax([children[child][0], children[child][1]], grandchildren, childBoard, depth-1, alpha, beta, false);
            // store the highest eval and move
            if (childEval > maxEval) {
                maxEval = childEval;
                maxMove = childMove;
            }
            // alpha-beta prune
            /*
            if (childEval > alpha)
                alpha = childEval;
            if (beta <= alpha)
                break;*/
        }
        return [maxEval, maxMove];  
    }
    // This player wants a min
    else {
        let minEval = Number.MAX_SAFE_INTEGER;
        let minMove = [];
        // get the eval and move of each child
        for (child=0; child<children.length; child++) {
            let childBoard = deepCopyBoard(board);
            childBoard = flipPieces(children[child][0], children[child][1], childBoard);
            childBoard = removePotentialPieces(childBoard);
            [childBoard, grandchildren] = calculatePotentialMoves(childBoard, false);
            let [childEval, childMove] = minimax([children[child][0], children[child][1]], grandchildren, childBoard, depth-1, alpha, beta, true);
            // store the lowest eval and move
            if (childEval < minEval) {
                minEval = childEval;
                minMove = childMove;
            }
            /*
            // alpha-beta prune
            if (childEval < beta)
                beta = childEval;
            if (beta <= alpha)
                break;*/
        }
        return [minEval, minMove];  
    }
}

// Returns the attractiveness of a potential move as an integer, higher value = better move
// Disc Count - Player Disc (+1 each), Opponent Disc (-1 each)
// Legal Moves Count - Opponent legal moves after this move (-10 each, -100 if corner)
// Current Move Corner Square (+100)
function heuristic(move, board) {
    // figure out which color just made the move
    let movingColor = 2;
    let opposingColor = 1;
    if (board[move[0]][move[1]] == 1) {
        movingColor = 1;
        opposingColor = 2;
    }

    // keeps track of piece evaluation
    let eval = 0;
    for (let row=0; row<BOARDHEIGHT; row++) {
        for (let col=0; col<BOARDWIDTH; col++) {
            // Disc Count
            if (board[row][col] == movingColor)
                eval++;
            else if (board[row][col] == opposingColor)
                eval--;
            // Legal Moves Count
            else if (board[row][col] == opposingColor+2) {
                if ((row == 0 || row == BOARDHEIGHT-1) && (col == 0 || col == BOARDWIDTH-1))
                    eval -= 100;
                else
                    eval -= 10;
            }
        }
    }
    // Current Move Corner Square
    if ((move[0] == 0 || move[0] == BOARDHEIGHT-1) && (move[1] == 0 || move[1] == BOARDWIDTH-1))
        eval += 100;

    return eval;
}

function printBoard(board) {
    console.log("-----------------");
    for (i=0; i<8; i++) {
        console.log(board[i]);
    }
    console.log("-----------------");
}
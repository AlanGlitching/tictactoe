const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Game state storage (in production, use a database)
const games = new Map();

// Game logic class
class TicTacToeGame {
  constructor(isAI = false, aiDifficulty = 'medium') {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.gameStatus = 'waiting'; // 'waiting', 'playing', 'paused', 'won', 'draw'
    this.winner = null;
    this.winningLine = null;
    this.players = {}; // Store player info: {playerId: {name, symbol, joined}}
    this.playerCount = 0;
    this.createdAt = new Date();
    this.rematchRequests = new Set(); // Track rematch requests
    this.isAI = isAI;
    this.aiDifficulty = aiDifficulty;
    this.aiPlayerId = isAI ? 'ai-player' : null;
    this.pausedBy = null; // Track who caused the game to pause
    this.pausedAt = null; // Track when the game was paused
    
    // If AI game, add AI player as O
    if (isAI) {
      this.players['ai-player'] = {
        name: `AI (${aiDifficulty})`,
        symbol: 'O',
        joined: true
      };
      this.playerCount = 1;
    }
  }

  addPlayer(playerId, playerName) {
    if (this.playerCount >= 2) {
      return { success: false, error: 'Game is full' };
    }

    const symbol = this.playerCount === 0 ? 'X' : 'O';
    this.players[playerId] = {
      name: playerName,
      symbol: symbol,
      joined: new Date()
    };
    this.playerCount++;

    if (this.playerCount === 2) {
      // If game was paused, resume it
      if (this.gameStatus === 'paused') {
        this.gameStatus = 'playing';
        this.pausedBy = null;
        this.pausedAt = null;
      } else {
        this.gameStatus = 'playing';
      }
    }

    return { success: true, symbol: symbol };
  }

  removePlayer(playerId) {
    if (this.players[playerId]) {
      delete this.players[playerId];
      this.playerCount--;
      
      // If a player leaves during an active game, pause it
      if (this.playerCount < 2 && this.gameStatus === 'playing') {
        this.gameStatus = 'paused';
        this.pausedBy = playerId; // Track who caused the pause
        this.pausedAt = new Date();
      }
    }
  }

  makeMove(position, playerId) {
    if (this.gameStatus !== 'playing') {
      return { success: false, error: 'Game is not active' };
    }

    if (this.board[position] !== null) {
      return { success: false, error: 'Position already occupied' };
    }

    const player = this.players[playerId];
    if (!player) {
      return { success: false, error: 'Player not in game' };
    }

    if (player.symbol !== this.currentPlayer) {
      return { success: false, error: 'Not your turn' };
    }

    this.board[position] = this.currentPlayer;
    
    if (this.checkWin()) {
      this.gameStatus = 'won';
      this.winner = this.currentPlayer;
    } else if (this.board.every(cell => cell !== null)) {
      this.gameStatus = 'draw';
    } else {
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    }

    return { success: true };
  }

  checkWin() {
    const winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (let combination of winningCombinations) {
      const [a, b, c] = combination;
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        this.winningLine = combination;
        return true;
      }
    }
    return false;
  }

  reset() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.gameStatus = this.playerCount === 2 ? 'playing' : 'waiting';
    this.winner = null;
    this.winningLine = null;
    this.rematchRequests = new Set(); // Track who requested rematch
    this.pausedBy = null;
    this.pausedAt = null;
  }

  // AI move logic
  makeAIMove() {
    if (!this.isAI || this.currentPlayer !== 'O' || this.gameStatus !== 'playing') {
      return false;
    }

    let move;
    switch (this.aiDifficulty) {
      case 'easy':
        move = this.getRandomMove();
        break;
      case 'medium':
        move = this.getMediumMove();
        break;
      case 'hard':
        move = this.getHardMove();
        break;
      default:
        move = this.getMediumMove();
    }

    if (move !== -1) {
      return this.makeMove(move, this.aiPlayerId);
    }
    return false;
  }

  getRandomMove() {
    const availableMoves = this.board
      .map((cell, index) => cell === null ? index : null)
      .filter(val => val !== null);
    
    if (availableMoves.length === 0) return -1;
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  getMediumMove() {
    // Try to win first
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) {
        this.board[i] = 'O';
        if (this.checkWinnerOnBoard(this.board)) {
          this.board[i] = null;
          return i;
        }
        this.board[i] = null;
      }
    }

    // Block player from winning
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) {
        this.board[i] = 'X';
        if (this.checkWinnerOnBoard(this.board)) {
          this.board[i] = null;
          return i;
        }
        this.board[i] = null;
      }
    }

    // Take center if available
    if (this.board[4] === null) return 4;

    // Take corners
    const corners = [0, 2, 6, 8];
    for (const corner of corners) {
      if (this.board[corner] === null) return corner;
    }

    // Take any available move
    return this.getRandomMove();
  }

  getHardMove() {
    return this.minimax(this.board, 'O').index;
  }

  minimax(board, player) {
    const availableMoves = board
      .map((cell, index) => cell === null ? index : null)
      .filter(val => val !== null);

    // Create a copy for checking
    const tempBoard = [...board];
    const winner = this.checkWinnerOnBoard(tempBoard);
    
    if (winner === 'O') return { score: 1 };
    if (winner === 'X') return { score: -1 };
    if (availableMoves.length === 0) return { score: 0 };

    const moves = [];
    
    for (const move of availableMoves) {
      const moveObj = { index: move };
      tempBoard[move] = player;
      
      const result = this.minimax(tempBoard, player === 'O' ? 'X' : 'O');
      moveObj.score = result.score;
      
      tempBoard[move] = null;
      moves.push(moveObj);
    }

    let bestMove;
    if (player === 'O') {
      let bestScore = -Infinity;
      for (const move of moves) {
        if (move.score > bestScore) {
          bestScore = move.score;
          bestMove = move;
        }
      }
    } else {
      let bestScore = Infinity;
      for (const move of moves) {
        if (move.score < bestScore) {
          bestScore = move.score;
          bestMove = move;
        }
      }
    }

    return bestMove;
  }

  checkWinnerOnBoard(board) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }

  requestRematch(playerId) {
    if (!this.players[playerId]) {
      return { success: false, error: 'Player not in game' };
    }

    if (this.gameStatus === 'playing') {
      return { success: false, error: 'Game is still in progress' };
    }

    this.rematchRequests.add(playerId);

    // If both players want rematch, reset the game
    if (this.rematchRequests.size === this.playerCount && this.playerCount === 2) {
      this.reset();
      return { success: true, rematchStarted: true };
    }

    return { success: true, rematchStarted: false, waitingFor: this.playerCount - this.rematchRequests.size };
  }

  getState(playerId = null) {
    const baseState = {
      board: this.board,
      currentPlayer: this.currentPlayer,
      gameStatus: this.gameStatus,
      winner: this.winner,
      winningLine: this.winningLine,
      playerCount: this.playerCount,
      players: Object.keys(this.players).map(id => ({
        name: this.players[id].name,
        symbol: this.players[id].symbol
      })),
      rematchRequests: this.rematchRequests.size,
      rematchNeeded: this.playerCount - this.rematchRequests.size,
      pausedBy: this.pausedBy,
      pausedAt: this.pausedAt
    };

    if (playerId && this.players[playerId]) {
      baseState.yourSymbol = this.players[playerId].symbol;
      baseState.yourTurn = this.players[playerId].symbol === this.currentPlayer;
      baseState.youRequestedRematch = this.rematchRequests.has(playerId);
    }

    return baseState;
  }
}

// API Routes

// Create a new game
app.post('/api/game', (req, res) => {
  const gameId = uuidv4();
  const game = new TicTacToeGame();
  games.set(gameId, game);
  
  res.json({
    gameId,
    ...game.getState()
  });
});

// Create a new AI game
app.post('/api/game/ai', (req, res) => {
  const { playerName, difficulty = 'medium' } = req.body;
  
  if (!playerName || playerName.length < 2 || playerName.length > 15) {
    return res.status(400).json({ error: 'Player name must be 2-15 characters' });
  }

  const gameId = uuidv4();
  const playerId = uuidv4();
  const game = new TicTacToeGame(true, difficulty);
  
  // Add human player as X
  game.addPlayer(playerId, playerName);
  game.gameStatus = 'playing'; // Start immediately since AI is already joined
  
  games.set(gameId, game);
  
  res.json({
    gameId,
    playerId,
    ...game.getState(playerId)
  });
});

// Join a game as a player
app.post('/api/game/:gameId/join', (req, res) => {
  const { gameId } = req.params;
  const { playerName } = req.body;
  const game = games.get(gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (!playerName || playerName.trim().length === 0) {
    return res.status(400).json({ error: 'Player name is required' });
  }
  
  const playerId = uuidv4();
  const result = game.addPlayer(playerId, playerName.trim());
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json({
    gameId,
    playerId,
    ...game.getState(playerId)
  });
});

// Get game state for a specific player
app.get('/api/game/:gameId/player/:playerId', (req, res) => {
  const { gameId, playerId } = req.params;
  const game = games.get(gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (!game.players[playerId]) {
    return res.status(403).json({ error: 'Player not in this game' });
  }
  
  res.json({
    gameId,
    playerId,
    ...game.getState(playerId)
  });
});

// Get basic game info (for joining)
app.get('/api/game/:gameId', (req, res) => {
  const { gameId } = req.params;
  const game = games.get(gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  res.json({
    gameId,
    gameStatus: game.gameStatus,
    playerCount: game.playerCount,
    canJoin: game.playerCount < 2
  });
});

// Make a move
app.post('/api/game/:gameId/move', (req, res) => {
  const { gameId } = req.params;
  const { position, playerId } = req.body;
  const game = games.get(gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (!playerId) {
    return res.status(400).json({ error: 'Player ID is required' });
  }
  
  if (position < 0 || position > 8 || !Number.isInteger(position)) {
    return res.status(400).json({ error: 'Invalid position' });
  }
  
  const result = game.makeMove(position, playerId);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // If it's an AI game and it's now AI's turn, make AI move
  if (game.isAI && game.currentPlayer === 'O' && game.gameStatus === 'playing') {
    setTimeout(() => {
      game.makeAIMove();
    }, 500); // Small delay to make AI move feel natural
  }
  
  res.json({
    gameId,
    playerId,
    ...game.getState(playerId)
  });
});

// Reset game
app.post('/api/game/:gameId/reset', (req, res) => {
  const { gameId } = req.params;
  const { playerId } = req.body;
  const game = games.get(gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (!playerId || !game.players[playerId]) {
    return res.status(403).json({ error: 'Only players in the game can reset it' });
  }
  
  game.reset();
  
  res.json({
    gameId,
    playerId,
    ...game.getState(playerId)
  });
});

// Request rematch
app.post('/api/game/:gameId/rematch', (req, res) => {
  const { gameId } = req.params;
  const { playerId } = req.body;
  const game = games.get(gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (!playerId || !game.players[playerId]) {
    return res.status(403).json({ error: 'Only players in the game can request rematch' });
  }
  
  const result = game.requestRematch(playerId);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json({
    gameId,
    playerId,
    rematchStarted: result.rematchStarted,
    waitingFor: result.waitingFor,
    ...game.getState(playerId)
  });
});

// Resume paused game (when player rejoins)
app.post('/api/game/:gameId/resume', (req, res) => {
  const { gameId } = req.params;
  const { playerId } = req.body;
  const game = games.get(gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (!playerId || !game.players[playerId]) {
    return res.status(403).json({ error: 'Only players in the game can resume it' });
  }
  
  if (game.gameStatus === 'paused' && game.playerCount === 2) {
    game.gameStatus = 'playing';
    game.pausedBy = null;
    game.pausedAt = null;
  }
  
  res.json({
    gameId,
    playerId,
    ...game.getState(playerId)
  });
});

// Delete game
app.delete('/api/game/:gameId', (req, res) => {
  const { gameId } = req.params;
  
  if (games.delete(gameId)) {
    res.json({ message: 'Game deleted successfully' });
  } else {
    res.status(404).json({ error: 'Game not found' });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Clean up old games (optional - runs every hour)
setInterval(() => {
  // In a real application, you might want to track game creation time
  // and clean up games older than a certain threshold
  console.log(`Current active games: ${games.size}`);
}, 3600000);

app.listen(PORT, () => {
  console.log(`TicTacToe server running on http://localhost:${PORT}`);
  console.log('Game endpoints:');
  console.log('  POST /api/game - Create new game');
  console.log('  GET /api/game/:gameId - Get game state');
  console.log('  POST /api/game/:gameId/move - Make a move');
  console.log('  POST /api/game/:gameId/reset - Reset game');
  console.log('  POST /api/game/:gameId/resume - Resume paused game');
  console.log('  DELETE /api/game/:gameId - Delete game');
}); 
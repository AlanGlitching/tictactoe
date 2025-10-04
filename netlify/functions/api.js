const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Game state storage (in production, use a database)
const games = new Map();
const matchmakingQueue = [];

// Game logic
class TicTacToeGame {
    constructor(gameId, playerName, difficulty = 'medium') {
        this.gameId = gameId;
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameStatus = 'waiting'; // waiting, playing, finished
        this.winner = null;
        this.winningLine = null;
        this.players = [{ id: 'player', name: playerName, symbol: 'X' }];
        this.isAI = true;
        this.difficulty = difficulty;
        this.createdAt = Date.now();
    }

    makeMove(position, playerId) {
        if (this.gameStatus !== 'playing' || this.board[position] !== null) {
            return { success: false, message: 'Invalid move' };
        }

        this.board[position] = this.currentPlayer;
        
        // Check for win
        const result = this.checkWin();
        if (result.winner) {
            this.gameStatus = 'finished';
            this.winner = result.winner;
            this.winningLine = result.line;
        } else if (this.board.every(cell => cell !== null)) {
            this.gameStatus = 'finished';
            this.winner = 'tie';
        } else {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        }

        return { success: true, gameState: this.getGameState() };
    }

    checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return { winner: this.board[a], line: pattern };
            }
        }
        return { winner: null, line: null };
    }

    getGameState() {
        return {
            gameId: this.gameId,
            board: this.board,
            currentPlayer: this.currentPlayer,
            gameStatus: this.gameStatus,
            winner: this.winner,
            winningLine: this.winningLine,
            players: this.players,
            isAI: this.isAI,
            difficulty: this.difficulty
        };
    }

    // AI move logic
    getAIMove() {
        const emptyCells = this.board.map((cell, index) => cell === null ? index : null).filter(val => val !== null);
        
        if (emptyCells.length === 0) return null;

        // Check for winning move
        for (const position of emptyCells) {
            const testBoard = [...this.board];
            testBoard[position] = 'O';
            if (this.checkWinForBoard(testBoard, 'O')) {
                return position;
            }
        }

        // Check for blocking move
        for (const position of emptyCells) {
            const testBoard = [...this.board];
            testBoard[position] = 'X';
            if (this.checkWinForBoard(testBoard, 'X')) {
                return position;
            }
        }

        // Strategy based on difficulty
        if (this.difficulty === 'easy') {
            // Random move
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        } else if (this.difficulty === 'hard') {
            // Minimax algorithm
            return this.minimax(this.board, 'O').position;
        } else {
            // Medium difficulty - mix of strategy and randomness
            if (Math.random() < 0.7) {
                // Try center, corners, then edges
                const center = 4;
                if (emptyCells.includes(center)) return center;
                
                const corners = [0, 2, 6, 8];
                const availableCorners = corners.filter(pos => emptyCells.includes(pos));
                if (availableCorners.length > 0) {
                    return availableCorners[Math.floor(Math.random() * availableCorners.length)];
                }
                
                const edges = [1, 3, 5, 7];
                const availableEdges = edges.filter(pos => emptyCells.includes(pos));
                if (availableEdges.length > 0) {
                    return availableEdges[Math.floor(Math.random() * availableEdges.length)];
                }
            }
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
    }

    checkWinForBoard(board, player) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] === player && board[a] === board[b] && board[a] === board[c]) {
                return true;
            }
        }
        return false;
    }

    minimax(board, player) {
        const emptyCells = board.map((cell, index) => cell === null ? index : null).filter(val => val !== null);
        
        if (this.checkWinForBoard(board, 'O')) return { score: 10 };
        if (this.checkWinForBoard(board, 'X')) return { score: -10 };
        if (emptyCells.length === 0) return { score: 0 };

        const moves = [];
        
        for (const position of emptyCells) {
            const move = { position };
            board[position] = player;
            
            if (player === 'O') {
                const result = this.minimax(board, 'X');
                move.score = result.score;
            } else {
                const result = this.minimax(board, 'O');
                move.score = result.score;
            }
            
            board[position] = null;
            moves.push(move);
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
}

// Routes

// Create a new multiplayer game
app.post('/game', (req, res) => {
    try {
        const gameId = `multi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const game = new TicTacToeGame(gameId, 'Host', 'medium');
        game.isAI = false;
        games.set(gameId, game);
        
        res.json({ gameId });
    } catch (error) {
        console.error('Error creating game:', error);
        res.status(500).json({ error: 'Failed to create game' });
    }
});

// Join a multiplayer game
app.post('/game/:gameId/join', (req, res) => {
    try {
        const { gameId } = req.params;
        const { playerName } = req.body;
        
        const game = games.get(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        if (game.players.length >= 2) {
            return res.status(400).json({ error: 'Game is full' });
        }

        const playerId = `player_${Date.now()}`;
        game.players.push({ id: playerId, name: playerName, symbol: 'O' });
        
        if (game.players.length === 2) {
            game.gameStatus = 'playing';
        }

        res.json({
            playerId,
            ...game.getGameState()
        });
    } catch (error) {
        console.error('Error joining game:', error);
        res.status(500).json({ error: 'Failed to join game' });
    }
});

// Get player-specific game state
app.get('/game/:gameId/player/:playerId', (req, res) => {
    try {
        const { gameId, playerId } = req.params;
        const game = games.get(gameId);
        
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        res.json(game.getGameState());
    } catch (error) {
        console.error('Error getting player game state:', error);
        res.status(500).json({ error: 'Failed to get game state' });
    }
});

// Matchmaking endpoints
app.post('/matchmaking/join', (req, res) => {
    try {
        const { playerName } = req.body;
        const playerId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Add to matchmaking queue
        matchmakingQueue.push({ playerId, playerName, joinedAt: Date.now() });
        
        res.json({ playerId, status: 'queued' });
    } catch (error) {
        console.error('Error joining matchmaking:', error);
        res.status(500).json({ error: 'Failed to join matchmaking' });
    }
});

app.get('/matchmaking/match/:playerId', (req, res) => {
    try {
        const { playerId } = req.params;
        
        // Find player in queue
        const playerIndex = matchmakingQueue.findIndex(p => p.playerId === playerId);
        if (playerIndex === -1) {
            return res.status(404).json({ error: 'Player not found in queue' });
        }

        // Check if we have enough players for a match
        if (matchmakingQueue.length >= 2) {
            const player1 = matchmakingQueue[0];
            const player2 = matchmakingQueue[1];
            
            // Remove both players from queue
            matchmakingQueue.splice(0, 2);
            
            // Create new game
            const gameId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const game = new TicTacToeGame(gameId, player1.playerName, 'medium');
            game.isAI = false;
            game.players = [
                { id: player1.playerId, name: player1.playerName, symbol: 'X' },
                { id: player2.playerId, name: player2.playerName, symbol: 'O' }
            ];
            game.gameStatus = 'playing';
            games.set(gameId, game);
            
            res.json({
                matched: true,
                gameId,
                player1: { id: player1.playerId, name: player1.playerName },
                player2: { id: player2.playerId, name: player2.playerName }
            });
        } else {
            res.json({ matched: false });
        }
    } catch (error) {
        console.error('Error checking match:', error);
        res.status(500).json({ error: 'Failed to check match' });
    }
});

app.get('/matchmaking/status/:playerId', (req, res) => {
    try {
        const { playerId } = req.params;
        
        const playerIndex = matchmakingQueue.findIndex(p => p.playerId === playerId);
        if (playerIndex === -1) {
            return res.status(404).json({ error: 'Player not found in queue' });
        }

        res.json({
            position: playerIndex + 1,
            totalPlayers: matchmakingQueue.length,
            estimatedWaitTime: matchmakingQueue.length * 30 // 30 seconds per player
        });
    } catch (error) {
        console.error('Error getting matchmaking status:', error);
        res.status(500).json({ error: 'Failed to get matchmaking status' });
    }
});

app.post('/game/ai', (req, res) => {
    try {
        const { playerName, difficulty = 'medium' } = req.body;
        
        if (!playerName || playerName.trim() === '') {
            return res.status(400).json({ error: 'Player name is required' });
        }

        const gameId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const game = new TicTacToeGame(gameId, playerName.trim(), difficulty);
        
        // Start the game immediately
        game.gameStatus = 'playing';
        
        games.set(gameId, game);
        
        res.json({
            gameId,
            playerId: 'player',
            ...game.getGameState()
        });
    } catch (error) {
        console.error('Error creating AI game:', error);
        res.status(500).json({ error: 'Failed to create AI game' });
    }
});

app.post('/game/:gameId/move', (req, res) => {
    try {
        const { gameId } = req.params;
        const { position, playerId } = req.body;
        
        const game = games.get(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        if (game.gameStatus !== 'playing') {
            return res.status(400).json({ error: 'Game is not in playing state' });
        }

        const result = game.makeMove(position, playerId);
        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }

        // If it's AI's turn and game is still playing, make AI move
        if (game.gameStatus === 'playing' && game.currentPlayer === 'O') {
            const aiMove = game.getAIMove();
            if (aiMove !== null) {
                game.makeMove(aiMove, 'ai');
            }
        }

        res.json(game.getGameState());
    } catch (error) {
        console.error('Error making move:', error);
        res.status(500).json({ error: 'Failed to make move' });
    }
});

app.get('/game/:gameId', (req, res) => {
    try {
        const { gameId } = req.params;
        const game = games.get(gameId);
        
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        res.json(game.getGameState());
    } catch (error) {
        console.error('Error getting game:', error);
        res.status(500).json({ error: 'Failed to get game' });
    }
});

app.post('/game/:gameId/rematch', (req, res) => {
    try {
        const { gameId } = req.params;
        const { playerId } = req.body;
        
        const game = games.get(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Reset game state
        game.board = Array(9).fill(null);
        game.currentPlayer = 'X';
        game.gameStatus = 'playing';
        game.winner = null;
        game.winningLine = null;

        res.json(game.getGameState());
    } catch (error) {
        console.error('Error rematching:', error);
        res.status(500).json({ error: 'Failed to rematch' });
    }
});

app.post('/game/:gameId/disconnect', (req, res) => {
    try {
        const { gameId } = req.params;
        const { playerId } = req.body;
        
        const game = games.get(gameId);
        if (game) {
            game.gameStatus = 'finished';
            games.delete(gameId);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error disconnecting:', error);
        res.status(500).json({ error: 'Failed to disconnect' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch all handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Export the Express app
module.exports = app;

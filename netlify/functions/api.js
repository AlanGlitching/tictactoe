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

// Helper function to parse request body
function parseBody(body) {
    try {
        return JSON.parse(body);
    } catch (e) {
        return {};
    }
}

// Helper function to create response
function createResponse(statusCode, body, headers = {}) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
            ...headers
        },
        body: JSON.stringify(body)
    };
}

// Main handler
exports.handler = async (event, context) => {
    const { httpMethod, path, body, queryStringParameters } = event;
    const pathSegments = path.split('/').filter(segment => segment);
    
    console.log('Request:', { httpMethod, path, pathSegments });

    // Handle CORS preflight
    if (httpMethod === 'OPTIONS') {
        return createResponse(200, { message: 'CORS preflight' });
    }

    try {
        // Route: POST /game/ai
        if (httpMethod === 'POST' && pathSegments[0] === 'game' && pathSegments[1] === 'ai') {
            const { playerName, difficulty = 'medium' } = parseBody(body);
            
            if (!playerName || playerName.trim() === '') {
                return createResponse(400, { error: 'Player name is required' });
            }

            const gameId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const game = new TicTacToeGame(gameId, playerName.trim(), difficulty);
            
            // Start the game immediately
            game.gameStatus = 'playing';
            
            games.set(gameId, game);
            
            return createResponse(200, {
                gameId,
                playerId: 'player',
                ...game.getGameState()
            });
        }

        // Route: POST /game/:gameId/move
        if (httpMethod === 'POST' && pathSegments[0] === 'game' && pathSegments[2] === 'move') {
            const gameId = pathSegments[1];
            const { position, playerId } = parseBody(body);
            
            const game = games.get(gameId);
            if (!game) {
                return createResponse(404, { error: 'Game not found' });
            }

            if (game.gameStatus !== 'playing') {
                return createResponse(400, { error: 'Game is not in playing state' });
            }

            const result = game.makeMove(position, playerId);
            if (!result.success) {
                return createResponse(400, { error: result.message });
            }

            // If it's AI's turn and game is still playing, make AI move
            if (game.gameStatus === 'playing' && game.currentPlayer === 'O') {
                const aiMove = game.getAIMove();
                if (aiMove !== null) {
                    game.makeMove(aiMove, 'ai');
                }
            }

            return createResponse(200, game.getGameState());
        }

        // Route: GET /game/:gameId
        if (httpMethod === 'GET' && pathSegments[0] === 'game' && pathSegments.length === 2) {
            const gameId = pathSegments[1];
            const game = games.get(gameId);
            
            if (!game) {
                return createResponse(404, { error: 'Game not found' });
            }

            return createResponse(200, game.getGameState());
        }

        // Route: POST /game/:gameId/rematch
        if (httpMethod === 'POST' && pathSegments[0] === 'game' && pathSegments[2] === 'rematch') {
            const gameId = pathSegments[1];
            const { playerId } = parseBody(body);
            
            const game = games.get(gameId);
            if (!game) {
                return createResponse(404, { error: 'Game not found' });
            }

            // Reset game state
            game.board = Array(9).fill(null);
            game.currentPlayer = 'X';
            game.gameStatus = 'playing';
            game.winner = null;
            game.winningLine = null;

            return createResponse(200, game.getGameState());
        }

        // Route: POST /game/:gameId/disconnect
        if (httpMethod === 'POST' && pathSegments[0] === 'game' && pathSegments[2] === 'disconnect') {
            const gameId = pathSegments[1];
            const { playerId } = parseBody(body);
            
            const game = games.get(gameId);
            if (game) {
                game.gameStatus = 'finished';
                games.delete(gameId);
            }

            return createResponse(200, { success: true });
        }

        // Route: GET /game/:gameId/player/:playerId
        if (httpMethod === 'GET' && pathSegments[0] === 'game' && pathSegments[2] === 'player') {
            const gameId = pathSegments[1];
            const playerId = pathSegments[3];
            const game = games.get(gameId);
            
            if (!game) {
                return createResponse(404, { error: 'Game not found' });
            }

            return createResponse(200, game.getGameState());
        }

        // Route: POST /game
        if (httpMethod === 'POST' && pathSegments[0] === 'game' && pathSegments.length === 1) {
            const gameId = `multi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const game = new TicTacToeGame(gameId, 'Host', 'medium');
            game.isAI = false;
            games.set(gameId, game);
            
            return createResponse(200, { gameId });
        }

        // Route: POST /game/:gameId/join
        if (httpMethod === 'POST' && pathSegments[0] === 'game' && pathSegments[2] === 'join') {
            const gameId = pathSegments[1];
            const { playerName } = parseBody(body);
            
            const game = games.get(gameId);
            if (!game) {
                return createResponse(404, { error: 'Game not found' });
            }

            if (game.players.length >= 2) {
                return createResponse(400, { error: 'Game is full' });
            }

            const playerId = `player_${Date.now()}`;
            game.players.push({ id: playerId, name: playerName, symbol: 'O' });
            
            if (game.players.length === 2) {
                game.gameStatus = 'playing';
            }

            return createResponse(200, {
                playerId,
                ...game.getGameState()
            });
        }

        // Route: POST /matchmaking/join
        if (httpMethod === 'POST' && pathSegments[0] === 'matchmaking' && pathSegments[1] === 'join') {
            const { playerName } = parseBody(body);
            const playerId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Add to matchmaking queue
            matchmakingQueue.push({ playerId, playerName, joinedAt: Date.now() });
            
            return createResponse(200, { playerId, status: 'queued' });
        }

        // Route: GET /matchmaking/match/:playerId
        if (httpMethod === 'GET' && pathSegments[0] === 'matchmaking' && pathSegments[1] === 'match') {
            const playerId = pathSegments[2];
            
            // Find player in queue
            const playerIndex = matchmakingQueue.findIndex(p => p.playerId === playerId);
            if (playerIndex === -1) {
                return createResponse(404, { error: 'Player not found in queue' });
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
                
                return createResponse(200, {
                    matched: true,
                    gameId,
                    player1: { id: player1.playerId, name: player1.playerName },
                    player2: { id: player2.playerId, name: player2.playerName }
                });
            } else {
                return createResponse(200, { matched: false });
            }
        }

        // Route: GET /matchmaking/status/:playerId
        if (httpMethod === 'GET' && pathSegments[0] === 'matchmaking' && pathSegments[1] === 'status') {
            const playerId = pathSegments[2];
            
            const playerIndex = matchmakingQueue.findIndex(p => p.playerId === playerId);
            if (playerIndex === -1) {
                return createResponse(404, { error: 'Player not found in queue' });
            }

            return createResponse(200, {
                position: playerIndex + 1,
                totalPlayers: matchmakingQueue.length,
                estimatedWaitTime: matchmakingQueue.length * 30 // 30 seconds per player
            });
        }

        // Route: GET /health
        if (httpMethod === 'GET' && pathSegments[0] === 'health') {
            return createResponse(200, { status: 'ok', timestamp: new Date().toISOString() });
        }

        // 404 for unknown routes
        return createResponse(404, { error: 'Endpoint not found' });

    } catch (error) {
        console.error('Function error:', error);
        return createResponse(500, { error: 'Internal server error' });
    }
};
class TicTacToeMultiplayerClient {
    constructor() {
        this.gameId = null;
        this.playerId = null;
        this.playerName = null;
        this.gameState = null;
        this.pollInterval = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.showLobby();
    }

    initializeElements() {
        // Screens
        this.lobbyScreen = document.getElementById('lobby-screen');
        this.gameScreen = document.getElementById('game-screen');
        
        // Lobby elements
        this.createPlayerNameInput = document.getElementById('create-player-name');
        this.createGameBtn = document.getElementById('create-game-btn');
        this.joinPlayerNameInput = document.getElementById('join-player-name');
        this.joinGameIdInput = document.getElementById('join-game-id');
        this.joinGameBtn = document.getElementById('join-game-btn');
        
        // Game elements
        this.gameBoard = document.getElementById('game-board');
        this.cells = document.querySelectorAll('.cell');
        this.gameStatus = document.getElementById('game-status');
        this.yourNameSpan = document.getElementById('your-name');
        this.yourSymbolSpan = document.getElementById('your-symbol');
        this.currentGameIdSpan = document.getElementById('current-game-id');
        this.playersListDiv = document.getElementById('players-list');
        this.copyIdBtn = document.getElementById('copy-id-btn');
        this.resetGameBtn = document.getElementById('reset-game-btn');
        this.leaveGameBtn = document.getElementById('leave-game-btn');
    }

    attachEventListeners() {
        // Lobby events
        this.createGameBtn.addEventListener('click', () => this.createGame());
        this.joinGameBtn.addEventListener('click', () => this.joinGame());
        
        // Game events
        this.copyIdBtn.addEventListener('click', () => this.copyGameId());
        this.resetGameBtn.addEventListener('click', () => this.resetGame());
        this.leaveGameBtn.addEventListener('click', () => this.leaveGame());
        
        // Enter key support
        this.createPlayerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createGame();
        });
        
        [this.joinPlayerNameInput, this.joinGameIdInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.joinGame();
            });
        });

        // Board events
        this.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.makeMove(index));
        });
    }

    showLobby() {
        this.lobbyScreen.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
        this.stopPolling();
        this.clearGameData();
    }

    showGame() {
        this.lobbyScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.startPolling();
    }

    clearGameData() {
        this.gameId = null;
        this.playerId = null;
        this.playerName = null;
        this.gameState = null;
        this.createPlayerNameInput.value = '';
        this.joinPlayerNameInput.value = '';
        this.joinGameIdInput.value = '';
    }

    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`/api${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            this.showError(error.message);
            throw error;
        }
    }

    async createGame() {
        const playerName = this.createPlayerNameInput.value.trim();
        if (!playerName) {
            this.showError('Please enter your name');
            return;
        }

        try {
            // Create game
            const gameData = await this.apiCall('/game', { method: 'POST' });
            this.gameId = gameData.gameId;
            
            // Join as player
            const joinData = await this.apiCall(`/game/${this.gameId}/join`, {
                method: 'POST',
                body: JSON.stringify({ playerName })
            });
            
            this.playerId = joinData.playerId;
            this.playerName = playerName;
            this.gameState = joinData;
            
            this.showGame();
            this.updateUI();
            this.showSuccess(`Game created! Share ID: ${this.gameId}`);
        } catch (error) {
            console.error('Failed to create game:', error);
        }
    }

    async joinGame() {
        const playerName = this.joinPlayerNameInput.value.trim();
        const gameId = this.joinGameIdInput.value.trim();
        
        if (!playerName) {
            this.showError('Please enter your name');
            return;
        }
        
        if (!gameId) {
            this.showError('Please enter a Game ID');
            return;
        }

        try {
            const joinData = await this.apiCall(`/game/${gameId}/join`, {
                method: 'POST',
                body: JSON.stringify({ playerName })
            });
            
            this.gameId = gameId;
            this.playerId = joinData.playerId;
            this.playerName = playerName;
            this.gameState = joinData;
            
            this.showGame();
            this.updateUI();
            this.showSuccess('Successfully joined the game!');
        } catch (error) {
            console.error('Failed to join game:', error);
        }
    }

    async makeMove(position) {
        if (!this.gameId || !this.playerId) {
            this.showError('Not connected to a game');
            return;
        }

        if (!this.gameState || this.gameState.gameStatus !== 'playing') {
            this.showError('Game is not active');
            return;
        }

        if (!this.gameState.yourTurn) {
            this.showError('It\'s not your turn!');
            return;
        }

        if (this.gameState.board[position] !== null) {
            this.showError('This cell is already occupied!');
            return;
        }

        try {
            this.gameState = await this.apiCall(`/game/${this.gameId}/move`, {
                method: 'POST',
                body: JSON.stringify({ position, playerId: this.playerId })
            });
            
            this.updateUI();
        } catch (error) {
            console.error('Failed to make move:', error);
        }
    }

    async resetGame() {
        if (!this.gameId || !this.playerId) {
            this.showError('Not connected to a game');
            return;
        }

        try {
            this.gameState = await this.apiCall(`/game/${this.gameId}/reset`, {
                method: 'POST',
                body: JSON.stringify({ playerId: this.playerId })
            });
            
            this.updateUI();
            this.showSuccess('Game has been reset!');
        } catch (error) {
            console.error('Failed to reset game:', error);
        }
    }

    leaveGame() {
        this.showLobby();
        this.showSuccess('Left the game');
    }

    async refreshGameState() {
        if (!this.gameId || !this.playerId) return;

        try {
            this.gameState = await this.apiCall(`/game/${this.gameId}/player/${this.playerId}`);
            this.updateUI();
        } catch (error) {
            console.error('Failed to refresh game state:', error);
            this.showError('Lost connection to game');
            this.showLobby();
        }
    }

    copyGameId() {
        if (!this.gameId) {
            this.showError('No game ID to copy');
            return;
        }

        navigator.clipboard.writeText(this.gameId).then(() => {
            this.showSuccess('Game ID copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = this.gameId;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showSuccess('Game ID copied to clipboard!');
        });
    }

    updateUI() {
        if (!this.gameState) return;
        
        this.updatePlayerInfo();
        this.updatePlayersList();
        this.updateBoard();
        this.updateGameStatus();
        this.updateControls();
    }

    updatePlayerInfo() {
        this.yourNameSpan.textContent = this.playerName;
        this.yourSymbolSpan.textContent = this.gameState.yourSymbol || '?';
        this.currentGameIdSpan.textContent = this.gameId ? this.gameId.substring(0, 8) + '...' : 'None';
    }

    updatePlayersList() {
        this.playersListDiv.innerHTML = '';
        
        if (this.gameState.players) {
            this.gameState.players.forEach(player => {
                const playerCard = document.createElement('div');
                playerCard.className = 'player-card';
                
                if (player.symbol === this.gameState.yourSymbol) {
                    playerCard.classList.add('you');
                } else if (player.symbol === this.gameState.currentPlayer) {
                    playerCard.classList.add('current-turn');
                }
                
                playerCard.innerHTML = `
                    <div class="player-name">${player.name}</div>
                    <div class="player-symbol">${player.symbol}</div>
                `;
                
                this.playersListDiv.appendChild(playerCard);
            });
        }
    }

    updateBoard() {
        this.cells.forEach((cell, index) => {
            // Clear previous classes
            cell.classList.remove('x', 'o', 'disabled', 'winning');
            
            if (this.gameState.board[index]) {
                const value = this.gameState.board[index];
                cell.textContent = value;
                cell.classList.add(value.toLowerCase());
            } else {
                cell.textContent = '';
            }

            // Disable cells based on game state and turn
            const shouldDisable = !this.gameState || 
                                this.gameState.gameStatus !== 'playing' || 
                                !this.gameState.yourTurn ||
                                this.gameState.board[index] !== null;
            
            if (shouldDisable) {
                cell.classList.add('disabled');
            }
        });

        // Highlight winning line
        if (this.gameState.winningLine) {
            this.gameState.winningLine.forEach(index => {
                this.cells[index].classList.add('winning');
            });
        }
    }

    updateGameStatus() {
        this.gameStatus.classList.remove('win', 'draw');
        
        if (!this.gameState) {
            this.gameStatus.textContent = 'Not connected to game';
            return;
        }

        switch (this.gameState.gameStatus) {
            case 'waiting':
                this.gameStatus.textContent = `Waiting for ${2 - this.gameState.playerCount} more player(s)...`;
                break;
            case 'playing':
                if (this.gameState.yourTurn) {
                    this.gameStatus.textContent = '🎯 Your turn!';
                } else {
                    const otherPlayer = this.gameState.players.find(p => p.symbol === this.gameState.currentPlayer);
                    this.gameStatus.textContent = `⏳ Waiting for ${otherPlayer ? otherPlayer.name : 'opponent'}...`;
                }
                break;
            case 'won':
                if (this.gameState.winner === this.gameState.yourSymbol) {
                    this.gameStatus.textContent = '🎉 You won!';
                } else {
                    const winner = this.gameState.players.find(p => p.symbol === this.gameState.winner);
                    this.gameStatus.textContent = `😔 ${winner ? winner.name : 'Opponent'} won!`;
                }
                this.gameStatus.classList.add('win');
                break;
            case 'draw':
                this.gameStatus.textContent = '🤝 It\'s a draw!';
                this.gameStatus.classList.add('draw');
                break;
        }
    }

    updateControls() {
        const canReset = this.gameState && (this.gameState.gameStatus === 'won' || this.gameState.gameStatus === 'draw');
        this.resetGameBtn.disabled = !canReset;
    }

    startPolling() {
        this.stopPolling();
        this.pollInterval = setInterval(() => {
            this.refreshGameState();
        }, 2000);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '10px',
            color: 'white',
            fontWeight: '600',
            zIndex: '1000',
            maxWidth: '300px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        switch (type) {
            case 'success':
                notification.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
                break;
            case 'error':
                notification.style.background = 'linear-gradient(45deg, #f44336, #d32f2f)';
                break;
            default:
                notification.style.background = 'linear-gradient(45deg, #2196F3, #1976D2)';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToeMultiplayerClient();
}); 
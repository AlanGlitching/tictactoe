class TicTacToeMultiplayerClient {
    constructor() {
        this.gameId = null;
        this.playerId = null;
        this.playerName = null;
        this.gameState = null;
        this.pollInterval = null;
        this.pendingAction = null; // For confirmation modal
        
        this.initializeElements();
        this.attachEventListeners();
        this.showWelcomeScreen();
    }

    initializeElements() {
        // Screens
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.choiceScreen = document.getElementById('choice-screen');
        this.createScreen = document.getElementById('create-screen');
        this.joinScreen = document.getElementById('join-screen');
        this.gameScreen = document.getElementById('game-screen');
        
        // Welcome elements
        this.startBtn = document.getElementById('start-btn');
        
        // Choice elements
        this.choiceCreateBtn = document.getElementById('choice-create-btn');
        this.choiceJoinBtn = document.getElementById('choice-join-btn');
        this.backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
        
        // Form elements
        this.createPlayerNameInput = document.getElementById('create-player-name');
        this.createGameBtn = document.getElementById('create-game-btn');
        this.joinPlayerNameInput = document.getElementById('join-player-name');
        this.joinGameIdInput = document.getElementById('join-game-id');
        this.joinGameBtn = document.getElementById('join-game-btn');
        this.backToChoiceBtn = document.getElementById('back-to-choice-btn');
        this.backToChoiceBtn2 = document.getElementById('back-to-choice-btn2');
        
        // Feedback elements
        this.createNameFeedback = document.getElementById('create-name-feedback');
        this.joinNameFeedback = document.getElementById('join-name-feedback');
        this.joinIdFeedback = document.getElementById('join-id-feedback');
        
        // Game elements
        this.gameBoard = document.getElementById('game-board');
        this.cells = document.querySelectorAll('.cell');
        this.gameStatus = document.getElementById('game-status');
        this.yourNameSpan = document.getElementById('your-name');
        this.yourSymbolSpan = document.getElementById('your-symbol');
        this.currentGameIdSpan = document.getElementById('current-game-id');
        this.playersListDiv = document.getElementById('players-list');
        this.copyIdBtn = document.getElementById('copy-id-btn');
        this.rematchBtn = document.getElementById('rematch-btn');
        this.resetGameBtn = document.getElementById('reset-game-btn');
        this.leaveGameBtn = document.getElementById('leave-game-btn');
        
        // Modal elements
        this.confirmationModal = document.getElementById('confirmation-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.modalConfirm = document.getElementById('modal-confirm');
        this.modalCancel = document.getElementById('modal-cancel');
    }

    attachEventListeners() {
        // Navigation events
        this.startBtn.addEventListener('click', () => this.showChoiceScreen());
        this.choiceCreateBtn.addEventListener('click', () => this.showCreateScreen());
        this.choiceJoinBtn.addEventListener('click', () => this.showJoinScreen());
        this.backToWelcomeBtn.addEventListener('click', () => this.showWelcomeScreen());
        this.backToChoiceBtn.addEventListener('click', () => this.showChoiceScreen());
        this.backToChoiceBtn2.addEventListener('click', () => this.showChoiceScreen());
        
        // Form events
        this.createGameBtn.addEventListener('click', () => this.createGame());
        this.joinGameBtn.addEventListener('click', () => this.joinGame());
        
        // Input validation
        this.createPlayerNameInput.addEventListener('input', () => this.validateCreateForm());
        this.joinPlayerNameInput.addEventListener('input', () => this.validateJoinForm());
        this.joinGameIdInput.addEventListener('input', () => this.validateJoinForm());
        
        // Game events
        this.copyIdBtn.addEventListener('click', () => this.copyGameId());
        this.rematchBtn.addEventListener('click', () => this.requestRematch());
        this.resetGameBtn.addEventListener('click', () => this.confirmAction('reset'));
        this.leaveGameBtn.addEventListener('click', () => this.confirmAction('leave'));
        
        // Modal events
        this.modalConfirm.addEventListener('click', () => this.executeConfirmedAction());
        this.modalCancel.addEventListener('click', () => this.hideModal());
        
        // Close modal on outside click
        this.confirmationModal.addEventListener('click', (e) => {
            if (e.target === this.confirmationModal) {
                this.hideModal();
            }
        });
        
        // Enter key support
        this.createPlayerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.createGameBtn.disabled === false) this.createGame();
        });
        
        [this.joinPlayerNameInput, this.joinGameIdInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && this.joinGameBtn.disabled === false) this.joinGame();
            });
        });

        // Board events
        this.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.makeMove(index));
        });
    }

    validateCreateForm() {
        const name = this.createPlayerNameInput.value.trim();
        const isValid = this.validatePlayerName(name);
        
        this.updateInputValidation(this.createPlayerNameInput, this.createNameFeedback, isValid, name);
        this.createGameBtn.disabled = !isValid.valid;
    }

    validateJoinForm() {
        const name = this.joinPlayerNameInput.value.trim();
        const gameId = this.joinGameIdInput.value.trim();
        
        const nameValid = this.validatePlayerName(name);
        const gameIdValid = this.validateGameId(gameId);
        
        this.updateInputValidation(this.joinPlayerNameInput, this.joinNameFeedback, nameValid, name);
        this.updateInputValidation(this.joinGameIdInput, this.joinIdFeedback, gameIdValid, gameId);
        
        this.joinGameBtn.disabled = !(nameValid && gameIdValid);
    }

    validatePlayerName(name) {
        if (name.length < 2) return { valid: false, message: 'Name too short (min 2 characters)' };
        if (name.length > 15) return { valid: false, message: 'Name too long (max 15 characters)' };
        if (!/^[a-zA-Z0-9\s-_]+$/.test(name)) return { valid: false, message: 'Only letters, numbers, spaces, - and _ allowed' };
        return { valid: true, message: '✓ Valid name' };
    }

    validateGameId(gameId) {
        if (gameId.length === 0) return { valid: false, message: 'Game ID required' };
        if (gameId.length < 8) return { valid: false, message: 'Game ID too short' };
        if (!/^[a-zA-Z0-9-]+$/.test(gameId)) return { valid: false, message: 'Invalid Game ID format' };
        return { valid: true, message: '✓ Valid Game ID' };
    }

    updateInputValidation(input, feedback, validation, value) {
        input.classList.remove('valid', 'invalid');
        feedback.classList.remove('success', 'error');
        
        if (value.length > 0) {
            if (validation.valid) {
                input.classList.add('valid');
                feedback.classList.add('success');
            } else {
                input.classList.add('invalid');
                feedback.classList.add('error');
            }
            feedback.textContent = validation.message;
        } else {
            feedback.textContent = '';
        }
    }

    showModal(title, message, confirmText = 'Confirm') {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.modalConfirm.textContent = confirmText;
        this.confirmationModal.classList.remove('hidden');
    }

    hideModal() {
        this.confirmationModal.classList.add('hidden');
        this.pendingAction = null;
    }

    confirmAction(action) {
        this.pendingAction = action;
        
        if (action === 'leave') {
            this.showModal(
                'Leave Game',
                'Are you sure you want to leave the game? Your opponent will be notified.',
                'Leave Game'
            );
        } else if (action === 'reset') {
            this.showModal(
                'Reset Game',
                'Are you sure you want to reset the game? This will clear the board and start over.',
                'Reset Game'
            );
        }
    }

    executeConfirmedAction() {
        if (this.pendingAction === 'leave') {
            this.leaveGame();
        } else if (this.pendingAction === 'reset') {
            this.resetGame();
        }
        this.hideModal();
    }

    showWelcomeScreen() {
        this.hideAllScreens();
        this.welcomeScreen.classList.remove('hidden');
        this.stopPolling();
        this.clearGameData();
    }

    showChoiceScreen() {
        this.hideAllScreens();
        this.choiceScreen.classList.remove('hidden');
    }

    showCreateScreen() {
        this.hideAllScreens();
        this.createScreen.classList.remove('hidden');
        this.createPlayerNameInput.focus();
    }

    showJoinScreen() {
        this.hideAllScreens();
        this.joinScreen.classList.remove('hidden');
        this.joinPlayerNameInput.focus();
    }

    showGameScreen() {
        this.hideAllScreens();
        this.gameScreen.classList.remove('hidden');
        this.startPolling();
    }

    hideAllScreens() {
        [this.welcomeScreen, this.choiceScreen, this.createScreen, this.joinScreen, this.gameScreen].forEach(screen => {
            screen.classList.add('hidden');
        });
    }

    clearGameData() {
        this.gameId = null;
        this.playerId = null;
        this.playerName = null;
        this.gameState = null;
        this.createPlayerNameInput.value = '';
        this.joinPlayerNameInput.value = '';
        this.joinGameIdInput.value = '';
        
        // Reset validation
        [this.createPlayerNameInput, this.joinPlayerNameInput, this.joinGameIdInput].forEach(input => {
            input.classList.remove('valid', 'invalid');
        });
        [this.createNameFeedback, this.joinNameFeedback, this.joinIdFeedback].forEach(feedback => {
            feedback.textContent = '';
            feedback.classList.remove('success', 'error');
        });
        
        this.createGameBtn.disabled = true;
        this.joinGameBtn.disabled = true;
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
        const validation = this.validatePlayerName(playerName);
        
        if (!validation.valid) {
            this.showError(validation.message);
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
            
            this.showGameScreen();
            this.updateUI();
            this.showSuccess(`Game created! Share ID: ${this.gameId.substring(0, 8)}...`);
        } catch (error) {
            console.error('Failed to create game:', error);
        }
    }

    async joinGame() {
        const playerName = this.joinPlayerNameInput.value.trim();
        const gameId = this.joinGameIdInput.value.trim();
        
        const nameValidation = this.validatePlayerName(playerName);
        const gameIdValidation = this.validateGameId(gameId);
        
        if (!nameValidation.valid) {
            this.showError(nameValidation.message);
            return;
        }
        
        if (!gameIdValidation.valid) {
            this.showError(gameIdValidation.message);
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
            
            this.showGameScreen();
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

    async requestRematch() {
        if (!this.gameId || !this.playerId) {
            this.showError('Not connected to a game');
            return;
        }

        try {
            const result = await this.apiCall(`/game/${this.gameId}/rematch`, {
                method: 'POST',
                body: JSON.stringify({ playerId: this.playerId })
            });
            
            this.gameState = result;
            this.updateUI();
            
            if (result.rematchStarted) {
                this.showSuccess('Rematch started! New game begins.');
            } else {
                this.showSuccess(`Rematch requested! Waiting for ${result.waitingFor} more player(s).`);
            }
        } catch (error) {
            console.error('Failed to request rematch:', error);
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
        this.showWelcomeScreen();
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
            this.showWelcomeScreen();
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
        const gameEnded = this.gameState && (this.gameState.gameStatus === 'won' || this.gameState.gameStatus === 'draw');
        const canReset = gameEnded;
        const canRematch = gameEnded && this.gameState.playerCount === 2;
        
        this.resetGameBtn.disabled = !canReset;
        this.rematchBtn.disabled = !canRematch;
        
        // Update rematch button text
        if (canRematch) {
            if (this.gameState.youRequestedRematch) {
                if (this.gameState.rematchNeeded > 0) {
                    this.rematchBtn.textContent = `Waiting (${this.gameState.rematchNeeded} more)`;
                    this.rematchBtn.disabled = true;
                } else {
                    this.rematchBtn.textContent = 'Rematch';
                }
            } else {
                this.rematchBtn.textContent = 'Rematch';
            }
        } else {
            this.rematchBtn.textContent = 'Rematch';
        }
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
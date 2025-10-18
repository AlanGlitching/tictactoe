class TicTacToeMultiplayerClient {
    constructor() {
        this.gameId = null;
        this.playerId = null;
        this.playerName = null;
        this.gameState = null;
        this.pollInterval = null;
        this.pendingAction = null; // For confirmation modal
        this.selectedDifficulty = 'medium';
        this.playerLeftNotified = false; // Prevent duplicate notifications
        
        // Memory game state
        this.memoryCards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.gameTimer = null;
        this.gameStartTime = 0;
        this.selectedMemorySize = 4;
        this.selectedTheme = 'animals';
        
        // API configuration - dynamically determine API URL based on current domain
        this.API_BASE_URL = this.getApiBaseUrl();
        this.API_RETRY_ATTEMPTS = 3;
        this.API_RETRY_DELAY = 1000; // 1 second
        this.serverAvailable = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.showWelcomeScreen();
        
        // Test connection in background without showing errors
        this.testConnection().catch(() => {
            // Silently fail - errors will be shown when user actually tries to use the app
        });
    }

    getApiBaseUrl() {
        // Get the current origin (protocol + hostname + port)
        const origin = window.location.origin;
        
        // If we're running on localhost, use the default port 3000
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return 'http://localhost:3000/api';
        }
        
        // Check if we're on Netlify - use Railway backend
        if (origin.includes('netlify.app') || origin.includes('netlify.com')) {
            // For Netlify deployment, use Railway backend from config
            return window.APP_CONFIG?.RAILWAY_API_URL || 'https://your-railway-app.railway.app/api';
        }
        
        // For ngrok or other external domains, use the same origin
        return `${origin}/api`;
    }

    initializeElements() {
        // Screens
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.choiceScreen = document.getElementById('choice-screen');
        this.tictactoeMenuScreen = document.getElementById('tictactoe-menu-screen');
        this.createScreen = document.getElementById('create-screen');
        this.joinScreen = document.getElementById('join-screen');
        this.vsAiScreen = document.getElementById('vs-ai-screen');
        this.quickmatchScreen = document.getElementById('quickmatch-screen');
        this.guessingScreen = document.getElementById('guessing-screen');
        this.memoryScreen = document.getElementById('memory-screen');
        this.gameScreen = document.getElementById('game-screen');
        
        // Welcome elements
        this.startBtn = document.getElementById('start-btn');
        
        // Choice elements
        this.choiceTicTacToeBtn = document.getElementById('choice-create-btn'); // Repurposed as TicTacToe
        this.choiceGuessingBtn = document.getElementById('choice-guessing-btn'); // Repurposed as Guessing Numbers
        this.choiceMemoryBtn = document.getElementById('choice-memory-btn'); // Memory Cards
        this.backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
        
        // TicTacToe menu elements
        this.tictactoeVsAiBtn = document.getElementById('tictactoe-vs-ai-btn');
        this.tictactoeCreateBtn = document.getElementById('tictactoe-create-btn');
        this.tictactoeQuickmatchBtn = document.getElementById('tictactoe-quickmatch-btn');
        this.tictactoeJoinBtn = document.getElementById('tictactoe-join-btn');
        this.backToGamesBtn = document.getElementById('back-to-games-btn');
        
        // Form elements
        this.createPlayerNameInput = document.getElementById('create-player-name');
        this.createGameBtn = document.getElementById('create-game-btn');
        this.joinPlayerNameInput = document.getElementById('join-player-name');
        this.joinGameIdInput = document.getElementById('join-game-id');
        this.joinGameBtn = document.getElementById('join-game-btn');
        this.aiPlayerNameInput = document.getElementById('ai-player-name');
        this.startAiGameBtn = document.getElementById('start-ai-game-btn');
        this.quickmatchPlayerNameInput = document.getElementById('quickmatch-player-name');
        this.findMatchBtn = document.getElementById('find-match-btn');
        this.guessingNumberInput = document.getElementById('guessing-number-input');
        this.submitGuessBtn = document.getElementById('submit-guess-btn');
        
        // Debug: Check if elements are found
        console.log('AI elements found:', {
            aiInput: !!this.aiPlayerNameInput,
            startBtn: !!this.startAiGameBtn
        });
        this.backToChoiceBtn = document.getElementById('back-to-choice-btn');
        this.backToChoiceBtn2 = document.getElementById('back-to-choice-btn2');
        this.backToChoiceBtn3 = document.getElementById('back-to-choice-btn3');
        this.backToChoiceBtn4 = document.getElementById('back-to-choice-btn4');
        this.backToChoiceBtn5 = document.getElementById('back-to-choice-btn5');
        this.backToChoiceBtn6 = document.getElementById('back-to-choice-btn6');
        
        // Feedback elements
        this.createNameFeedback = document.getElementById('create-name-feedback');
        this.joinNameFeedback = document.getElementById('join-name-feedback');
        this.joinIdFeedback = document.getElementById('join-id-feedback');
        this.aiNameFeedback = document.getElementById('ai-name-feedback');
        this.quickmatchNameFeedback = document.getElementById('quickmatch-name-feedback');
        this.guessingNumberFeedback = document.getElementById('guessing-number-feedback');
        
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
        // 移除重置遊戲按鈕的引用
        // this.resetGameBtn = document.getElementById('reset-game-btn');
        this.leaveGameBtn = document.getElementById('leave-game-btn');
        this.attemptsLeftSpan = document.getElementById('attempts-left');
        this.previousGuessesDiv = document.getElementById('previous-guesses');
        this.memoryBoard = document.getElementById('memory-board');
        this.memoryMoves = document.getElementById('memory-moves');
        this.memoryPairs = document.getElementById('memory-pairs');
        this.memoryTime = document.getElementById('memory-time');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.difficultySelection = document.getElementById('difficulty-selection');
        this.gameInterface = document.getElementById('game-interface');
        this.startMemoryGameBtn = document.getElementById('start-memory-game-btn');
        this.changeDifficultyBtn = document.getElementById('change-difficulty-btn');
        
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
        this.choiceTicTacToeBtn.addEventListener('click', () => this.showTicTacToeMenu());
        this.choiceGuessingBtn.addEventListener('click', () => this.showGuessingScreen());
        this.choiceMemoryBtn.addEventListener('click', () => this.showMemoryScreen());
        this.backToWelcomeBtn.addEventListener('click', () => this.showWelcomeScreen());
        this.backToChoiceBtn.addEventListener('click', () => this.showTicTacToeMenu());
        this.backToChoiceBtn2.addEventListener('click', () => this.showTicTacToeMenu());
        this.backToChoiceBtn3.addEventListener('click', () => this.showTicTacToeMenu());
        this.backToChoiceBtn4.addEventListener('click', () => this.showTicTacToeMenu());
        this.backToChoiceBtn5.addEventListener('click', () => this.showChoiceScreen());
        this.backToChoiceBtn6.addEventListener('click', () => this.showChoiceScreen());
        this.tictactoeVsAiBtn.addEventListener('click', () => this.showVsAiScreen());
        this.tictactoeCreateBtn.addEventListener('click', () => this.showCreateScreen());
        this.tictactoeQuickmatchBtn.addEventListener('click', () => this.showQuickmatchScreen());
        this.tictactoeJoinBtn.addEventListener('click', () => this.showJoinScreen());
        this.backToGamesBtn.addEventListener('click', () => this.showChoiceScreen());
        
        // Form events
        this.createGameBtn.addEventListener('click', () => this.createGame());
        this.joinGameBtn.addEventListener('click', () => this.joinGame());
        this.findMatchBtn.addEventListener('click', () => this.findMatch());
        this.submitGuessBtn.addEventListener('click', () => this.submitGuess());
        
        // Add debug for AI button
        if (this.startAiGameBtn) {
            this.startAiGameBtn.addEventListener('click', () => {
                console.log('AI start button clicked!');
                this.startAiGame();
            });
            console.log('AI start button event listener added');
        } else {
            console.error('AI start button not found!');
        }
        
        // Input validation
        this.createPlayerNameInput.addEventListener('input', () => this.validateCreateForm());
        this.joinPlayerNameInput.addEventListener('input', () => this.validateJoinForm());
        this.joinGameIdInput.addEventListener('input', () => this.validateJoinForm());
        this.aiPlayerNameInput.addEventListener('input', () => this.validateAiForm());
        this.quickmatchPlayerNameInput.addEventListener('input', () => this.validateQuickmatchForm());
        this.guessingNumberInput.addEventListener('input', () => this.validateGuessingForm());

        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectDifficulty(e.target.closest('.difficulty-btn')));
        });
        
        // Game events
        this.copyIdBtn.addEventListener('click', () => this.copyGameId());
        this.rematchBtn.addEventListener('click', () => this.requestRematch());
        // this.resetGameBtn.addEventListener('click', () => this.confirmAction('reset')); // 移除重置遊戲按鈕的監聽器
        this.leaveGameBtn.addEventListener('click', () => this.confirmAction('leave'));
        // 移除測試暫停按鈕的監聽器
        // this.testPauseBtn.addEventListener('click', () => this.testPause());
        this.newGameBtn.addEventListener('click', () => this.initializeMemoryGame());
        this.startMemoryGameBtn.addEventListener('click', () => this.startMemoryGame());
        this.changeDifficultyBtn.addEventListener('click', () => this.showDifficultySelection());
        
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

        this.aiPlayerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.startAiGameBtn.disabled === false) this.startAiGame();
        });

        this.guessingNumberInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.submitGuessBtn.disabled === false) this.submitGuess();
        });

        // Board events
        this.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.makeMove(index));
        });

        // DEBUG: Add debugging function to window for testing
        window.debugAI = () => {
            console.log('=== MANUAL DEBUG ===');
            console.log('AI input element:', this.aiPlayerNameInput);
            console.log('AI input value:', this.aiPlayerNameInput?.value);
            console.log('AI button element:', this.startAiGameBtn);
            console.log('AI button disabled:', this.startAiGameBtn?.disabled);
            console.log('Button style pointer-events:', this.startAiGameBtn ? window.getComputedStyle(this.startAiGameBtn).pointerEvents : 'N/A');
            
            // Force validation
            this.validateAiForm();
            
            // Manual override if needed
            if (this.startAiGameBtn && this.aiPlayerNameInput.value.trim().length >= 2) {
                this.startAiGameBtn.disabled = false;
                this.startAiGameBtn.style.pointerEvents = 'auto';
                console.log('Manually enabled button and pointer events');
            }
        };
        
        // DEBUG: Add server test function
        window.testServer = async () => {
            console.log('=== MANUAL SERVER TEST ===');
            const result = await this.testConnection();
            console.log('Server test result:', result);
            console.log('Server available:', this.serverAvailable);
        };
        
        // Add a function to manually enable the AI button
        window.enableAIButton = () => {
            if (this.startAiGameBtn) {
                this.startAiGameBtn.disabled = false;
                this.startAiGameBtn.style.pointerEvents = 'auto';
                console.log('AI button manually enabled');
            }
        };
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

    validateGuess(guess) {
        if (guess.length === 0) return { valid: false, message: 'Please enter a number' };
        const num = parseInt(guess);
        if (isNaN(num)) return { valid: false, message: 'Please enter a valid number' };
        if (num < 1 || num > 100) return { valid: false, message: 'Number must be between 1 and 100' };
        return { valid: true, message: '✓ Valid guess' };
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
        }
        // 移除重置遊戲的確認邏輯
    }

    executeConfirmedAction() {
        if (this.pendingAction === 'leave') {
            this.leaveGame();
        }
        // 移除重置遊戲的執行邏輯
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

    showVsAiScreen() {
        this.hideAllScreens();
        this.vsAiScreen.classList.remove('hidden');
        this.aiPlayerNameInput.focus();
        
        // Ensure medium difficulty is selected by default
        const mediumBtn = document.querySelector('.difficulty-btn[data-difficulty="medium"]');
        if (mediumBtn && !mediumBtn.classList.contains('active')) {
            this.selectDifficulty(mediumBtn);
        }
        
        // Force validation immediately and after a small delay to ensure DOM is ready
        this.validateAiForm();
        setTimeout(() => {
            this.validateAiForm();
        }, 100);
    }

    showQuickmatchScreen() {
        this.hideAllScreens();
        this.quickmatchScreen.classList.remove('hidden');
        this.quickmatchPlayerNameInput.focus();
        
        // Force validation immediately
        this.validateQuickmatchForm();
    }

    showGuessingScreen() {
        this.hideAllScreens();
        this.guessingScreen.classList.remove('hidden');
        this.guessingNumberInput.focus();
        
        // Initialize the guessing game
        this.initializeGuessingGame();
    }

    showMemoryScreen() {
        this.hideAllScreens();
        this.memoryScreen.classList.remove('hidden');
        
        // Initialize the memory game
        this.initializeMemoryGame();
    }

    showDifficultySelection() {
        // Show difficulty selection, hide game interface
        this.difficultySelection.style.display = 'block';
        this.gameInterface.style.display = 'none';
        
        // Reset game state
        this.memoryCards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        
        // Clear timer
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    showGameScreen() {
        this.hideAllScreens();
        this.gameScreen.classList.remove('hidden');
        this.startPolling();
    }

    showTicTacToeMenu() {
        this.hideAllScreens();
        this.tictactoeMenuScreen.classList.remove('hidden');
    }

    showComingSoonMessage() {
        this.showError('More games coming soon! Stay tuned for updates.');
    }

    hideAllScreens() {
        [this.welcomeScreen, this.choiceScreen, this.tictactoeMenuScreen, this.createScreen, this.joinScreen, this.vsAiScreen, this.quickmatchScreen, this.guessingScreen, this.memoryScreen, this.gameScreen].forEach(screen => {
            screen.classList.add('hidden');
        });
    }

    clearGameData() {
        // Stop all polling
        this.stopPolling();
        this.stopMatchmakingPolling();
        
        // Clear game state
        this.gameId = null;
        this.playerId = null;
        this.playerName = null;
        this.gameState = null;
        this.matchmakingPlayerId = null;
        this.pendingAction = null;
        this.playerLeftNotified = false; // Reset notification flag
        
        // Clear form inputs
        this.createPlayerNameInput.value = '';
        this.joinPlayerNameInput.value = '';
        this.joinGameIdInput.value = '';
        // Don't clear AI input as it might have user data
        // this.aiPlayerNameInput.value = '';
        
        // Reset validation
        [this.createPlayerNameInput, this.joinPlayerNameInput, this.joinGameIdInput, this.aiPlayerNameInput].forEach(input => {
            input.classList.remove('valid', 'invalid');
        });
        [this.createNameFeedback, this.joinNameFeedback, this.joinIdFeedback, this.aiNameFeedback].forEach(feedback => {
            feedback.textContent = '';
            feedback.classList.remove('success', 'error');
        });
        
        // Reset buttons
        this.createGameBtn.disabled = true;
        this.joinGameBtn.disabled = true;
        // Don't disable AI button as it should be controlled by validation
        // this.startAiGameBtn.disabled = true;
        
        // Hide any modals
        this.hideModal();
        
        // Clear any player left screens
        const existingScreen = document.getElementById('player-left-screen');
        if (existingScreen) {
            existingScreen.remove();
        }
    }

    selectDifficulty(btn) {
        // Remove active class from all buttons
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        // Store selected difficulty
        this.selectedDifficulty = btn.dataset.difficulty;
        // Validate form
        this.validateAiForm();
    }

    validateAiForm() {
        console.log('=== AI FORM VALIDATION DEBUG START ===');
        
        if (!this.aiPlayerNameInput) {
            console.error('AI player name input element not found!');
            return { valid: false, message: 'Input element missing' };
        }
        
        if (!this.startAiGameBtn) {
            console.error('AI start button element not found!');
            return { valid: false, message: 'Button element missing' };
        }
        
        const playerName = this.aiPlayerNameInput.value.trim();
        const isValid = this.validatePlayerName(playerName);
        
        console.log('Raw input value:', this.aiPlayerNameInput.value);
        console.log('Trimmed player name:', playerName);
        console.log('Name length:', playerName.length);
        console.log('Validation result:', isValid);
        
        this.updateInputValidation(this.aiPlayerNameInput, this.aiNameFeedback, isValid, playerName);
        
        const wasDisabled = this.startAiGameBtn.disabled;
        this.startAiGameBtn.disabled = !isValid.valid;
        
        console.log('Button state changed from', wasDisabled, 'to', this.startAiGameBtn.disabled);
        console.log('Button should be enabled:', isValid.valid);
        console.log('Button classes:', this.startAiGameBtn.className);
        console.log('Button style pointer-events:', window.getComputedStyle(this.startAiGameBtn).pointerEvents);
        
        // Force remove pointer-events none if button should be enabled
        if (isValid.valid) {
            this.startAiGameBtn.style.pointerEvents = 'auto';
            console.log('Manually enabled pointer events');
        }
        
        console.log('=== AI FORM VALIDATION DEBUG END ===');
        
        return isValid;
    }

    validateQuickmatchForm() {
        const playerName = this.quickmatchPlayerNameInput.value.trim();
        const isValid = this.validatePlayerName(playerName);
        
        this.updateInputValidation(this.quickmatchPlayerNameInput, this.quickmatchNameFeedback, isValid, playerName);
        this.findMatchBtn.disabled = !isValid.valid;
        
        return isValid;
    }

    validateGuessingForm() {
        const guess = this.guessingNumberInput.value.trim();
        const isValid = this.validateGuess(guess);
        
        this.updateInputValidation(this.guessingNumberInput, this.guessingNumberFeedback, isValid, guess);
        this.submitGuessBtn.disabled = !isValid.valid;
        
        return isValid;
    }

    async startAiGame() {
        console.log('startAiGame called');
        
        const validation = this.validateAiForm();
        console.log('Validation result:', validation);
        
        if (!validation.valid) {
            console.log('Validation failed:', validation.message);
            this.showError(validation.message);
            return;
        }

        try {
            console.log('Starting AI game...');
            
            // Clear any existing game state first
            this.clearGameData();
            
            this.startAiGameBtn.disabled = true;
            this.startAiGameBtn.textContent = 'Starting...';

            const requestData = {
                playerName: this.aiPlayerNameInput.value.trim(),
                difficulty: this.selectedDifficulty
            };
            console.log('Sending request:', requestData);

            const response = await this.apiCall('/game/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            
            console.log('AI game response:', response);

            this.gameId = response.gameId;
            this.playerId = response.playerId;
            this.playerName = this.aiPlayerNameInput.value.trim();
            this.gameState = response;
            
            this.showGameScreen();
            this.updateUI();
            this.showSuccess(`AI game started! Difficulty: ${this.selectedDifficulty}`);

        } catch (error) {
            console.error('Failed to start AI game:', error);
            this.showError(error.message || 'Failed to start AI game');
        } finally {
            this.startAiGameBtn.disabled = false;
            this.startAiGameBtn.textContent = 'Start Game';
        }
    }

    async findMatch() {
        const validation = this.validateQuickmatchForm();
        
        if (!validation.valid) {
            this.showError(validation.message);
            return;
        }

        try {
            this.findMatchBtn.disabled = true;
            this.findMatchBtn.textContent = 'Finding Match...';

            const response = await this.apiCall('/matchmaking/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    playerName: this.quickmatchPlayerNameInput.value.trim() 
                })
            });
            
            if (response.matched) {
                // Match found! Start the game
                this.gameId = response.gameId;
                this.playerId = response.playerId;
                this.playerName = this.quickmatchPlayerNameInput.value.trim();
                this.gameState = response;
                
                this.showGameScreen();
                this.updateUI();
                this.showSuccess(`Match found! Playing against ${response.opponent}`);
            } else {
                // No match yet, start polling for status
                this.matchmakingPlayerId = response.playerId;
                this.startMatchmakingPolling();
                this.showSuccess('Searching for opponent...');
            }

        } catch (error) {
            console.error('Failed to find match:', error);
            this.showError(error.message || 'Failed to find match');
        } finally {
            this.findMatchBtn.disabled = false;
            this.findMatchBtn.textContent = 'Find Match';
        }
    }

    startMatchmakingPolling() {
        if (this.matchmakingPollInterval) {
            clearInterval(this.matchmakingPollInterval);
        }
        
        this.matchmakingPollInterval = setInterval(async () => {
            try {
                // First check if we got matched
                try {
                    const match = await this.apiCall(`/matchmaking/match/${this.matchmakingPlayerId}`);
                    if (match.matched) {
                        this.stopMatchmakingPolling();
                        
                        // Match found! Start the game
                        this.gameId = match.gameId;
                        this.playerId = match.playerId;
                        this.playerName = this.quickmatchPlayerNameInput.value.trim();
                        this.gameState = match;
                        
                        this.showGameScreen();
                        this.updateUI();
                        this.showSuccess(`Match found! Playing against ${match.opponent}`);
                        return;
                    }
                } catch (matchError) {
                    // No match yet, continue polling status
                }
                
                // Check queue status
                const status = await this.apiCall(`/matchmaking/status/${this.matchmakingPlayerId}`);
                console.log('Matchmaking status:', status);
                
            } catch (error) {
                console.error('Failed to get matchmaking status:', error);
                this.stopMatchmakingPolling();
            }
        }, 2000); // Check every 2 seconds
    }

    stopMatchmakingPolling() {
        if (this.matchmakingPollInterval) {
            clearInterval(this.matchmakingPollInterval);
            this.matchmakingPollInterval = null;
        }
    }

    async testConnection() {
        try {
            console.log('Testing connection to server...');
            const response = await fetch(`${this.API_BASE_URL.replace('/api', '')}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                mode: 'cors'
            });
            
            console.log('Health check response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Server connection test successful:', data);
                this.serverAvailable = true;
                return true;
            } else {
                console.warn('Server health check failed:', response.status, response.statusText);
                this.serverAvailable = false;
                return false;
            }
        } catch (error) {
            console.error('Server connection test failed:', error);
            this.serverAvailable = false;
            return false;
        }
    }

    async apiCall(endpoint, options = {}, retryCount = 0) {
        // Check server availability first
        if (!this.serverAvailable && retryCount === 0) {
            console.log('Server availability unknown, testing connection first...');
            await this.testConnection();
        }
        
        try {
            console.log(`Making API call to: ${this.API_BASE_URL}${endpoint} (attempt ${retryCount + 1})`);
            console.log('Options:', options);
            
            const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = { error: errorText };
                }
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('API Response data:', data);
            return data;
        } catch (error) {
            console.error('API Error Details:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
                endpoint: `${this.API_BASE_URL}${endpoint}`,
                options: options,
                retryCount: retryCount
            });
            
            // Retry logic for network errors (only for actual API calls, not connection tests)
            if (retryCount < this.API_RETRY_ATTEMPTS && 
                (error.name === 'TypeError' || error.message.includes('Failed to fetch')) &&
                !endpoint.includes('/health')) {
                console.log(`Retrying API call in ${this.API_RETRY_DELAY}ms...`);
                await new Promise(resolve => setTimeout(resolve, this.API_RETRY_DELAY));
                return this.apiCall(endpoint, options, retryCount + 1);
            }
            
            // Only show error messages after all retries are exhausted
            if (retryCount >= this.API_RETRY_ATTEMPTS) {
                console.log(`Showing error after ${retryCount} retries for endpoint: ${endpoint}`);
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    console.error('Network error - server may be down or unreachable');
                    this.showError('無法連接到伺服器。請確保伺服器正在運行 (npm start) 並檢查網路連接。');
                } else if (error.message.includes('Failed to fetch')) {
                    console.error('Fetch failed - possible CORS or network issue');
                    this.showError('網路連接失敗。請檢查瀏覽器控制台獲取詳細錯誤信息。');
                } else if (error.message.includes('CORS')) {
                    console.error('CORS error detected');
                    this.showError('跨域請求被阻止。請檢查伺服器 CORS 配置。');
                } else {
                    console.error('API error:', error.message);
                    this.showError(`API 錯誤: ${error.message}`);
                }
            } else {
                console.log(`Not showing error yet, retry ${retryCount}/${this.API_RETRY_ATTEMPTS} for endpoint: ${endpoint}`);
            }
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

        // Disable the cell temporarily to prevent double-clicks
        const cell = this.cells[position];
        cell.style.pointerEvents = 'none';
        cell.style.opacity = '0.7';

        try {
            console.log(`Making move: position ${position}, player ${this.playerId}`);
            this.gameState = await this.apiCall(`/game/${this.gameId}/move`, {
                method: 'POST',
                body: JSON.stringify({ position, playerId: this.playerId })
            });
            
            console.log('Move successful, updating UI...');
            this.updateUI();
        } catch (error) {
            console.error('Failed to make move:', error);
            // Re-enable the cell if the move failed
            cell.style.pointerEvents = 'auto';
            cell.style.opacity = '1';
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

    // 移除重置遊戲功能
    // async resetGame() {
    //     if (!this.gameId || !this.playerId) {
    //         this.showError('Not connected to a game');
    //         return;
    //     }

    //     try {
    //         this.gameState = await this.apiCall(`/game/${this.gameId}/reset`, {
    //             method: 'POST',
    //             body: JSON.stringify({ playerId: this.playerId })
    //         });
            
    //         this.updateUI();
    //         this.showSuccess('Game has been reset!');
    //         } catch (error) {
    //             console.error('Failed to reset game:', error);
    //         }
    //     }


    initializeGuessingGame() {
        // Generate a random number between 1 and 100
        this.targetNumber = Math.floor(Math.random() * 100) + 1;
        this.attemptsLeft = 10;
        this.previousGuesses = [];
        this.lowerBound = null;
        this.upperBound = null;
        
        // Reset UI
        this.guessingNumberInput.value = '';
        this.attemptsLeftSpan.textContent = this.attemptsLeft;
        this.previousGuessesDiv.innerHTML = '';
        this.submitGuessBtn.disabled = true;
        
        // Clear feedback
        this.guessingNumberFeedback.textContent = '';
        this.guessingNumberFeedback.classList.remove('success', 'error');
        this.guessingNumberInput.classList.remove('valid', 'invalid');
        
        // Initialize range display
        this.updateRangeDisplay();
        
        console.log('Guessing game initialized. Target number:', this.targetNumber);
    }

    submitGuess() {
        const validation = this.validateGuessingForm();
        if (!validation.valid) {
            this.showError(validation.message);
            return;
        }

        const guess = parseInt(this.guessingNumberInput.value);
        
        // Add to previous guesses
        this.previousGuesses.push(guess);
        
        // Decrease attempts
        this.attemptsLeft--;
        
        // Check if correct
        if (guess === this.targetNumber) {
            this.showSuccess(`🎉 Correct! You found the number in ${11 - this.attemptsLeft} attempts!`);
            this.endGuessingGame();
            return;
        }
        
        // Check if out of attempts
        if (this.attemptsLeft <= 0) {
            this.showError(`😔 Game Over! The number was ${this.targetNumber}. Better luck next time!`);
            this.endGuessingGame();
            return;
        }
        
        // Update range tracking
        if (guess > this.targetNumber) {
            // Guess is too high, update upper bound
            if (!this.upperBound || guess < this.upperBound) {
                this.upperBound = guess;
            }
        } else {
            // Guess is too low, update lower bound
            if (!this.lowerBound || guess > this.lowerBound) {
                this.lowerBound = guess;
            }
        }
        
        // Update the range display
        this.updateRangeDisplay();
        
        // Update UI
        this.attemptsLeftSpan.textContent = this.attemptsLeft;
        this.updatePreviousGuesses();
        this.guessingNumberInput.value = '';
        this.submitGuessBtn.disabled = true;
        
        // Re-validate form
        this.validateGuessingForm();
    }

    updateRangeDisplay() {
        const rangeInfo = document.getElementById('range-info');
        if (!rangeInfo) return;

        let rangeText;
        if (this.lowerBound && this.upperBound) {
            rangeText = `${this.lowerBound} < X < ${this.upperBound}`;
        } else if (this.lowerBound) {
            rangeText = `${this.lowerBound} < X < 100`;
        } else if (this.upperBound) {
            rangeText = `1 < X < ${this.upperBound}`;
        } else {
            rangeText = '1 < X < 100';
        }

        rangeInfo.textContent = rangeText;
    }

    initializeMemoryGame() {
        // Clear previous game state
        this.memoryCards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        
        // Clear timer
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        // Show difficulty selection
        this.difficultySelection.style.display = 'block';
        this.gameInterface.style.display = 'none';
        
        // Add difficulty selection event listeners
        this.addDifficultySelectionListeners();
        
        console.log('Memory game initialized, waiting for difficulty selection');
    }

    addDifficultySelectionListeners() {
        const difficultyOptions = document.querySelectorAll('.difficulty-option');
        const themeOptions = document.querySelectorAll('.theme-option');
        
        // Remove existing listeners to avoid duplicates
        difficultyOptions.forEach(option => {
            option.removeEventListener('click', this.handleDifficultySelection);
            option.classList.remove('selected');
        });
        
        themeOptions.forEach(option => {
            option.removeEventListener('click', this.handleThemeSelection);
            option.classList.remove('selected');
        });
        
        // Add new listeners
        difficultyOptions.forEach(option => {
            option.addEventListener('click', this.handleDifficultySelection.bind(this));
        });
        
        themeOptions.forEach(option => {
            option.addEventListener('click', this.handleThemeSelection.bind(this));
        });
    }

    handleDifficultySelection(event) {
        const selectedOption = event.currentTarget;
        const size = parseInt(selectedOption.dataset.size);
        
        // Remove selection from all options
        document.querySelectorAll('.difficulty-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selection to clicked option
        selectedOption.classList.add('selected');
        
        // Store selected difficulty
        this.selectedMemorySize = size;
        
        // Enable start button
        this.startMemoryGameBtn.disabled = false;
        
        console.log('Difficulty selected:', size);
    }

    handleThemeSelection(event) {
        const selectedOption = event.currentTarget;
        const theme = selectedOption.dataset.theme;
        
        // Remove selection from all options
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selection to clicked option
        selectedOption.classList.add('selected');
        
        // Store selected theme
        this.selectedTheme = theme;
        
        console.log('Theme selected:', theme);
    }

    startMemoryGame() {
        if (!this.selectedMemorySize) {
            this.showError('Please select a difficulty level first');
            return;
        }
        
        // Hide difficulty selection, show game interface
        this.difficultySelection.style.display = 'none';
        this.gameInterface.style.display = 'block';
        
        // Create cards based on selected size
        this.createMemoryCards(this.selectedMemorySize);
        
        // Start the game
        this.gameStartTime = Date.now();
        this.gameTimer = setInterval(() => {
            this.updateMemoryTime();
        }, 1000);
        
        console.log('Memory game started with size:', this.selectedMemorySize);
    }

    createMemoryCards(size) {
        console.log('=== CREATE MEMORY CARDS DEBUG ===');
        console.log('Selected theme:', this.selectedTheme);
        console.log('Selected size:', size);
        
        // Define card symbols based on theme and size
        let allSymbols = [];
        
        if (this.selectedTheme === 'mahjong') {
            // Mahjong tiles symbols
            allSymbols = ['🀄', '🀅', '🀆', '🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏', '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘', '🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡', '🀢', '🀣', '🀤', '🀥', '🀦', '🀧', '🀨', '🀩', '🀪', '🀫'];
        } else if (this.selectedTheme === 'poker') {
            // Poker/Playing cards symbols - using clearer, more readable symbols
            allSymbols = ['A♠', '2♠', '3♠', '4♠', '5♠', '6♠', '7♠', '8♠', '9♠', '10♠', 'J♠', 'Q♠', 'K♠', 'A♥', '2♥', '3♥', '4♥', '5♥', '6♥', '7♥', '8♥', '9♥', '10♥', 'J♥', 'Q♥', 'K♥', 'A♦', '2♦', '3♦', '4♦', '5♦', '6♦', '7♦', '8♦', '9♦', '10♦', 'J♦', 'Q♦', 'K♦', 'A♣', '2♣', '3♣', '4♣', '5♣', '6♣', '7♣', '8♣', '9♣', '10♣', 'J♣', 'Q♣', 'K♣'];
        } else if (this.selectedTheme === 'combined') {
            // Combined theme - mix of different symbols
            allSymbols = ['🐶', '🐱', '🀄', '🀅', '🂡', '🂢', '🎲', '🎯', '⭐', '🌟', '💎', '🔮', '🎪', '🎨', '🎭', '🎪', '🎨', '🎭', '🎪', '🎨', '🎭', '🎪', '🎨', '🎭', '🎪', '🎨', '🎭', '🎪', '🎨', '🎭', '🎪', '🎨', '🎭', '🎪', '🎨', '🎭', '🎪', '🎨', '🎭', '🎪'];
        } else {
            // Animal emojis (default) - comprehensive collection
            allSymbols = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦏', '🦛', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔'];
        }
        
        console.log('All symbols array length:', allSymbols.length);
        console.log('First 5 symbols:', allSymbols.slice(0, 5));
        
        // Calculate how many pairs we need
        const totalCards = size * size;
        const pairsNeeded = Math.floor(totalCards / 2);
        
        console.log('Total cards needed:', totalCards);
        console.log('Pairs needed:', pairsNeeded);
        
        // Select symbols for this game
        const selectedSymbols = allSymbols.slice(0, pairsNeeded);
        const cards = [];
        
        console.log('Selected symbols for game:', selectedSymbols);
        
        // Create pairs
        selectedSymbols.forEach(symbol => {
            cards.push({ id: `${symbol}-1`, symbol: symbol, isFlipped: false, isMatched: false });
            cards.push({ id: `${symbol}-2`, symbol: symbol, isFlipped: false, isMatched: false });
        });
        
        // If odd number of cards, add one extra card (will be unmatched)
        if (totalCards % 2 === 1) {
            const extraSymbol = allSymbols[pairsNeeded];
            cards.push({ id: `${extraSymbol}-extra`, symbol: extraSymbol, isFlipped: false, isMatched: false, isExtra: true });
        }
        
        console.log('Final cards array:', cards);
        console.log('First card example:', cards[0]);
        
        // Shuffle cards
        this.memoryCards = this.shuffleArray(cards);
        
        // Update UI
        this.renderMemoryBoard();
        this.updateMemoryStats();
        
        console.log(`Created ${cards.length} cards with ${pairsNeeded} pairs using ${this.selectedTheme} theme`);
        console.log('=== END CREATE MEMORY CARDS DEBUG ===');
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    renderMemoryBoard() {
        if (!this.memoryBoard) {
            console.error('Memory board element not found!');
            return;
        }
        
        console.log('=== RENDER MEMORY BOARD DEBUG ===');
        console.log('Memory board element:', this.memoryBoard);
        console.log('Selected theme:', this.selectedTheme);
        console.log('Memory cards array:', this.memoryCards);
        
        this.memoryBoard.innerHTML = '';
        
        // Set grid columns based on selected size
        this.memoryBoard.style.gridTemplateColumns = `repeat(${this.selectedMemorySize}, 1fr)`;
        console.log('Setting grid columns to:', this.selectedMemorySize);
        console.log('Grid template columns:', this.memoryBoard.style.gridTemplateColumns);
        
        if (!this.memoryCards || this.memoryCards.length === 0) {
            console.error('No memory cards to render!');
            return;
        }
        
        this.memoryCards.forEach((card, index) => {
            console.log(`Rendering card ${index}:`, card);
            
            const cardElement = document.createElement('div');
            cardElement.className = 'memory-card';
            cardElement.dataset.index = index;
            cardElement.dataset.theme = this.selectedTheme;
            
            if (card.isMatched) {
                cardElement.classList.add('matched');
            }
            if (card.isFlipped) {
                cardElement.classList.add('flipped');
            }
            
            if (card.isExtra) {
                cardElement.classList.add('extra-card');
            }
            
            // Proper card structure for flip animation
            const cardHTML = `
                <div class="card-inner">
                    <div class="card-front">❓</div>
                    <div class="card-back">${card.symbol}</div>
                </div>
            `;
            
            console.log(`Card ${index} HTML:`, cardHTML);
            console.log(`Card ${index} symbol: "${card.symbol}"`);
            console.log(`Card ${index} theme: "${this.selectedTheme}"`);
            console.log(`Card element classes:`, cardElement.className);
            console.log(`Card element dataset:`, cardElement.dataset);
            console.log(`Card element attributes:`, cardElement.attributes);
            
            cardElement.innerHTML = cardHTML;
            
            cardElement.addEventListener('click', () => this.flipCard(index));
            this.memoryBoard.appendChild(cardElement);
        });
        
        console.log('=== END RENDER DEBUG ===');
    }

    flipCard(index) {
        const card = this.memoryCards[index];
        
        // Don't flip if card is already flipped, matched, or if we're waiting
        if (card.isFlipped || card.isMatched || this.flippedCards.length >= 2) {
            return;
        }
        
        // Flip the card
        card.isFlipped = true;
        this.flippedCards.push(index);
        
        // Update UI by adding flipped class to the specific card
        const cardElement = this.memoryBoard.children[index];
        if (cardElement) {
            cardElement.classList.add('flipped');
            console.log(`Card ${index} flipped. Symbol: "${card.symbol}", Element classes:`, cardElement.className);
            console.log(`Card element:`, cardElement);
        }
        
        // Check if we have two flipped cards
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateMemoryStats();
            
            // Check for match
            const card1 = this.memoryCards[this.flippedCards[0]];
            const card2 = this.memoryCards[this.flippedCards[1]];
            
            if (card1.symbol === card2.symbol) {
                // Match found!
                card1.isMatched = true;
                card2.isMatched = true;
                this.matchedPairs++;
                
                this.flippedCards = [];
                this.updateMemoryStats();
                
                // Check if game is complete
                const totalPairs = Math.floor((this.selectedMemorySize * this.selectedMemorySize) / 2);
                if (this.matchedPairs === totalPairs) {
                    this.endMemoryGame();
                }
            } else {
                // No match, flip back after delay
                setTimeout(() => {
                    // Store the indices before clearing the array
                    const flippedIndex1 = this.flippedCards[0];
                    const flippedIndex2 = this.flippedCards[1];
                    
                    card1.isFlipped = false;
                    card2.isFlipped = false;
                    this.flippedCards = [];
                    
                    // Remove flipped class from both cards
                    const cardElement1 = this.memoryBoard.children[flippedIndex1];
                    const cardElement2 = this.memoryBoard.children[flippedIndex2];
                    if (cardElement1) cardElement1.classList.remove('flipped');
                    if (cardElement2) cardElement2.classList.remove('flipped');
                }, 1000);
            }
        }
    }

    updateMemoryStats() {
        if (this.memoryMoves) this.memoryMoves.textContent = this.moves;
        if (this.memoryPairs) this.memoryPairs.textContent = this.matchedPairs;
    }

    updateMemoryTime() {
        if (!this.gameStartTime || !this.memoryTime) return;
        
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        this.memoryTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    endMemoryGame() {
        // Stop timer
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        const timeElapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;
        
        // Calculate total pairs needed
        const totalPairs = Math.floor((this.selectedMemorySize * this.selectedMemorySize) / 2);
        
        this.showSuccess(`🎉 Congratulations! You completed the ${this.selectedMemorySize}x${this.selectedMemorySize} game in ${this.moves} moves and ${minutes}:${seconds.toString().padStart(2, '0')}!`);
    }

    endGuessingGame() {
        // Optionally, you might want to reset the game or show a new game screen
        // For now, just clear the guessing game state
        this.initializeGuessingGame();
    }

    updatePreviousGuesses() {
        this.previousGuessesDiv.innerHTML = '';
        this.previousGuesses.forEach(guess => {
            const guessItem = document.createElement('div');
            guessItem.textContent = guess;
            this.previousGuessesDiv.appendChild(guessItem);
        });
    }

    async leaveGame() {
        // Notify server that player is leaving
        if (this.gameId && this.playerId) {
            try {
                await this.apiCall(`/game/${this.gameId}/disconnect`, {
                    method: 'POST',
                    body: JSON.stringify({ playerId: this.playerId })
                });
                console.log('Successfully notified server of player disconnect');
            } catch (error) {
                console.error('Failed to notify server of disconnect:', error);
                // Continue with leaving even if notification fails
            }
        }
        
        // Stop polling to prevent further API calls
        this.stopPolling();
        this.stopMatchmakingPolling();
        
        // Clear all game data
        this.clearGameData();
        
        // Show welcome screen
        this.showWelcomeScreen();
        this.showSuccess('Left the game');
    }

    async refreshGameState() {
        if (!this.gameId || !this.playerId) {
            console.log('refreshGameState: No gameId or playerId');
            return;
        }

        console.log('refreshGameState: Polling game state...', {
            gameId: this.gameId,
            playerId: this.playerId
        });

        try {
            this.gameState = await this.apiCall(`/game/${this.gameId}/player/${this.playerId}`);
            console.log('refreshGameState: Game state updated:', {
                gameStatus: this.gameState.gameStatus,
                pausedBy: this.gameState.pausedBy,
                isAI: this.gameState.isAI
            });
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
        
        console.log('updateUI: Updating UI with game state:', {
            gameStatus: this.gameState.gameStatus,
            pausedBy: this.gameState.pausedBy,
            playerCount: this.gameState.playerCount,
            isAI: this.gameState.isAI
        });
        
        this.updatePlayerInfo();
        this.updatePlayersList();
        this.updateBoard();
        this.updateGameStatus();
        this.updateControls();
        
        // Check for player left scenario and show screen if needed
        this.checkForPlayerLeft();
    }

    updatePlayerInfo() {
        this.yourNameSpan.textContent = this.playerName;
        this.yourSymbolSpan.textContent = this.gameState.yourSymbol || '?';
        
        // Hide Game ID for VS AI games only since they're not needed
        const gameIdInfo = document.querySelector('.game-id-info');
        
        // Detect AI games by checking if any player name contains "AI"
        const isAIGame = this.gameState && this.gameState.players && 
                         this.gameState.players.some(player => player.name.includes('AI'));
        
        console.log('Game ID hiding logic:', {
            gameIdInfo: !!gameIdInfo,
            gameState: !!this.gameState,
            isAI: this.gameState?.isAI,
            isAIGame: isAIGame,
            players: this.gameState?.players?.map(p => p.name),
            gameStatus: this.gameState?.gameStatus
        });
        
        if (gameIdInfo) {
            if (isAIGame) {
                // For VS AI games only, hide the Game ID section
                gameIdInfo.style.display = 'none';
                console.log('Game ID hidden for AI game');
            } else {
                // For regular multiplayer and matchmaking games, show the Game ID
                gameIdInfo.style.display = 'flex';
                this.currentGameIdSpan.textContent = this.gameId ? this.gameId.substring(0, 8) + '...' : 'None';
                console.log('Game ID shown for multiplayer/matchmaking game');
            }
        } else {
            console.error('Game ID info element not found!');
        }
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
            
            if (this.gameState.board && this.gameState.board[index]) {
                const value = this.gameState.board[index];
                cell.textContent = value;
                cell.classList.add(value.toLowerCase());
            } else {
                cell.textContent = '';
            }

            // Disable cells based on game state and turn
            const shouldDisable = !this.gameState || 
                                this.gameState.gameStatus !== 'playing' || 
                                this.gameState.gameStatus === 'paused' ||
                                !this.gameState.yourTurn ||
                                (this.gameState.board && this.gameState.board[index] !== null);
            
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
        this.gameStatus.classList.remove('win', 'draw', 'paused');
        
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
                    if (this.gameState.isAI && otherPlayer && otherPlayer.name.includes('AI')) {
                        this.gameStatus.textContent = '🤔 AI is thinking...';
                    } else {
                        this.gameStatus.textContent = `⏳ Waiting for ${otherPlayer ? otherPlayer.name : 'opponent'}...`;
                    }
                }
                break;
            case 'paused':
                this.gameStatus.classList.add('paused');
                if (this.gameState.pausedBy) {
                    const leftPlayer = this.gameState.players.find(p => p.symbol !== this.gameState.yourSymbol);
                    if (leftPlayer) {
                        this.gameStatus.textContent = `⏸️ Game paused - ${leftPlayer.name} left the game`;
                    } else {
                        this.gameStatus.textContent = '⏸️ Game paused - Opponent left the game';
                    }
                } else {
                    this.gameStatus.textContent = '⏸️ Game paused - Waiting for opponent to return';
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
                break;
        }
    }

    updateControls() {
        const gameEnded = this.gameState && (this.gameState.gameStatus === 'won' || this.gameState.gameStatus === 'draw');
        const gamePaused = this.gameState && this.gameState.gameStatus === 'paused';
        const isAIGame = this.gameState && this.gameState.isAI;
        const isMatchmakingGame = this.gameState && this.gameState.isMatchmaking;
        
        // 移除重置遊戲按鈕的邏輯
        const canRematch = gameEnded && (isAIGame || this.gameState.playerCount === 2);
        this.rematchBtn.disabled = !canRematch;
        
        // Update rematch button text
        if (canRematch) {
            if (isAIGame) {
                // AI games: rematch starts immediately
                this.rematchBtn.textContent = 'New Game';
            } else if (this.gameState.youRequestedRematch) {
                // Regular and matchmaking games: wait for other player
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
        
        // Show pause message if game is paused
        if (gamePaused) {
            this.showMessage('Game paused - waiting for opponent to return', 'info');
        }
        
        // Show rematch request popup if opponent requested rematch
        if (this.gameState && this.gameState.rematchRequests > 0 && !this.gameState.youRequestedRematch) {
            this.showRematchRequestPopup();
        }
    }

    startPolling() {
        this.stopPolling();
        
        // Use faster polling for all games to catch player disconnections quickly
        const pollInterval = this.gameState && this.gameState.isAI ? 500 : 1000;
        
        console.log('startPolling: Starting polling with interval:', pollInterval);
        
        this.pollInterval = setInterval(() => {
            console.log('Polling: Checking for game state updates...');
            this.refreshGameState();
        }, pollInterval);
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
        // Check if this is a guessing game hint and should be displayed centrally
        if (type === 'info' && message.includes('📊 Range:')) {
            this.showCentralMessage(message, type);
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '20px 25px',
            borderRadius: '15px',
            color: 'white',
            fontWeight: '700',
            fontSize: '16px',
            zIndex: '2000',
            maxWidth: '400px',
            minWidth: '300px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
            transform: 'translateX(120%)',
            transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
            lineHeight: '1.4'
        });

        switch (type) {
            case 'success':
                notification.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                notification.style.borderColor = 'rgba(76, 175, 80, 0.3)';
                break;
            case 'error':
                notification.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
                notification.style.borderColor = 'rgba(244, 67, 54, 0.3)';
                break;
            case 'info':
                notification.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
                notification.style.borderColor = 'rgba(33, 150, 243, 0.3)';
                break;
            default:
                notification.style.background = 'linear-gradient(135deg, #FF9800, #F57C00)';
                notification.style.borderColor = 'rgba(255, 152, 0, 0.3)';
        }

        document.body.appendChild(notification);

        // Add entrance animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.4)';
        }, 100);

        // Add pulse effect for important messages
        if (type === 'error' || type === 'success') {
            notification.style.animation = 'notificationPulse 2s ease-in-out infinite';
        }

        // Auto-remove after longer duration for better readability
        setTimeout(() => {
            notification.style.transform = 'translateX(120%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }, 5000);
    }

    showCentralMessage(message, type = 'info') {
        // Remove any existing central message
        const existingMessage = document.getElementById('central-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const centralNotification = document.createElement('div');
        centralNotification.id = 'central-message';
        centralNotification.className = `central-notification central-notification-${type}`;
        centralNotification.textContent = message;
        
        Object.assign(centralNotification.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '25px 35px',
            borderRadius: '20px',
            color: 'white',
            fontWeight: '800',
            fontSize: '20px',
            zIndex: '2500',
            maxWidth: '500px',
            minWidth: '400px',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
            opacity: '0',
            transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(15px)',
            textAlign: 'center',
            lineHeight: '1.5',
            background: 'linear-gradient(135deg, #667eea, #764ba2)'
        });

        document.body.appendChild(centralNotification);

        // Add entrance animation
        setTimeout(() => {
            centralNotification.style.opacity = '1';
            centralNotification.style.transform = 'translate(-50%, -50%) scale(1.1)';
        }, 100);

        // Add pulse effect
        centralNotification.style.animation = 'centralMessagePulse 3s ease-in-out infinite';

        // Auto-remove after longer duration for guessing game hints
        setTimeout(() => {
            centralNotification.style.opacity = '0';
            centralNotification.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => {
                if (centralNotification.parentNode) {
                    centralNotification.parentNode.removeChild(centralNotification);
                }
            }, 500);
        }, 4000);
    }

    showRematchRequestPopup() {
        // Remove any existing rematch request screen
        const existingScreen = document.getElementById('rematch-request-screen');
        if (existingScreen) {
            existingScreen.remove();
        }

        const screen = document.createElement('div');
        screen.id = 'rematch-request-screen';
        screen.className = 'rematch-request-screen';
        
        screen.innerHTML = `
            <div class="rematch-request-content">
                <div class="rematch-icon">🔄</div>
                <h2>Rematch Request!</h2>
                <p>Your opponent wants to play again!<br>Would you like to accept?</p>
                <div class="rematch-request-buttons">
                    <button class="btn btn-success" id="accept-rematch-btn">Yes, Let's Play!</button>
                    <button class="btn btn-secondary" id="decline-rematch-btn">No, Thanks</button>
                </div>
            </div>
        `;

        document.body.appendChild(screen);

        // Add event listeners
        document.getElementById('accept-rematch-btn').addEventListener('click', () => {
            this.requestRematch();
            screen.remove();
        });

        document.getElementById('decline-rematch-btn').addEventListener('click', () => {
            screen.remove();
        });

        // Auto-remove after 15 seconds if not responded to
        setTimeout(() => {
            if (screen.parentNode) {
                screen.remove();
            }
        }, 15000);
    }

    showPlayerLeftScreen() {
        // Remove any existing player left screen
        const existingScreen = document.getElementById('player-left-screen');
        if (existingScreen) {
            existingScreen.remove();
        }

        const screen = document.createElement('div');
        screen.id = 'player-left-screen';
        screen.className = 'player-left-screen';
        
        screen.innerHTML = `
            <div class="player-left-content">
                <div class="player-left-icon">🚪</div>
                <h2>⚠️ Player Left the Game</h2>
                <p>Your opponent has disconnected from the game.<br>You will be returned to the lobby.</p>
                <div class="player-left-buttons">
                    <button class="btn btn-primary" id="return-to-lobby-btn">🏠 Return to Lobby</button>
                </div>
            </div>
        `;

        // Add CSS styles for the screen
        screen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease-in;
        `;

        const content = screen.querySelector('.player-left-content');
        content.style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(screen);

        // Add event listeners
        document.getElementById('return-to-lobby-btn').addEventListener('click', () => {
            this.leaveGame();
            screen.remove();
        });

        // Auto-return to lobby after 5 seconds
        setTimeout(() => {
            if (screen.parentNode) {
                this.leaveGame();
                screen.remove();
            }
        }, 5000);
    }

    hidePlayerLeftScreen() {
        const existingScreen = document.getElementById('player-left-screen');
        if (existingScreen) {
            existingScreen.remove();
            this.showSuccess('Opponent has returned! Game resumed.');
        }
    }

    checkForPlayerLeft() {
        // Only check if we're in a game and not already showing the screen
        if (!this.gameState || !this.gameId) {
            console.log('checkForPlayerLeft: No game state or game ID');
            return;
        }
        
        const existingScreen = document.getElementById('player-left-screen');
        if (existingScreen) {
            console.log('checkForPlayerLeft: Screen already exists');
            return; // Already showing the screen
        }
        
        // Skip check for AI games
        if (this.gameState.isAI) {
            console.log('checkForPlayerLeft: Skipping AI game');
            return;
        }
        
        // Debug logging for all game states - with safe property access
        console.log('checkForPlayerLeft: Checking game state:', {
            gameStatus: this.gameState.gameStatus || 'unknown',
            pausedBy: this.gameState.pausedBy || null,
            playerCount: this.gameState.playerCount || 0,
            isAI: this.gameState.isAI || false,
            isMatchmaking: this.gameState.isMatchmaking || false
        });
        
        // Check if game is paused due to player leaving
        if (this.gameState.gameStatus === 'paused' && this.gameState.pausedBy) {
            console.log('checkForPlayerLeft: Player left detected!', {
                gameStatus: this.gameState.gameStatus,
                pausedBy: this.gameState.pausedBy,
                playerCount: this.gameState.playerCount
            });
            
            // Prevent duplicate notifications - check if we already notified for this specific pause
            const pauseKey = `${this.gameId}-${this.gameState.pausedBy}`;
            if (this.playerLeftNotified === pauseKey) {
                console.log('checkForPlayerLeft: Already notified about this specific player leaving');
                return;
            }
            
            this.playerLeftNotified = pauseKey;
            
            // Show immediate notification first
            this.showError('⚠️ Your opponent has left the game!');
            
            // Then show the player left screen
            setTimeout(() => {
                this.showPlayerLeftScreen();
            }, 1000);
        }
        
        // No need to check for game resumption since we return to lobby when player leaves
    }
}

    // Initialize the game when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        window.gameClient = new TicTacToeMultiplayerClient();
    });
    
    // Handle page unload/disconnect
    window.addEventListener('beforeunload', () => {
        if (window.gameClient && window.gameClient.gameId && window.gameClient.playerId) {
            // Use sendBeacon for reliability
            const success = navigator.sendBeacon(
                `${window.gameClient.API_BASE_URL}/game/${window.gameClient.gameId}/disconnect`,
                JSON.stringify({ playerId: window.gameClient.playerId })
            );
            
            if (!success) {
                // Fallback to fetch if sendBeacon fails
                fetch(`${window.gameClient.API_BASE_URL}/game/${window.gameClient.gameId}/disconnect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playerId: window.gameClient.playerId })
                }).catch(() => {}); // Ignore errors on page unload
            }
        }
    });
    
    // Also handle page visibility change (tab switching, minimizing)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && window.gameClient && window.gameClient.gameId && window.gameClient.playerId) {
            console.log('Page hidden, player may have left');
        }
    }); 
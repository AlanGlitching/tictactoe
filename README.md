# 🎮 Arcade - Multiplayer Games Server

A multiplayer arcade games platform built with Node.js and Express. Currently featuring TicTacToe with more games coming soon! Each player connects from their own device/browser for authentic multiplayer gameplay.

## ✨ Features

### 🎮 Platform Features
- **Multi-Game Arcade**: Growing collection of multiplayer games
- **Game Selection Menu**: Choose from available games with beautiful interface
- **Beautiful UI**: Modern, responsive design with smooth animations
- **Cross-platform**: Works on desktop and mobile devices
- **RESTful API**: Clean API endpoints for game interactions

### 🎯 TicTacToe Game Features
- **True Multiplayer**: Each player connects from separate devices/browsers
- **Player Sessions**: Individual player authentication and game sessions
- **Turn-based Gameplay**: Only the current player can make moves
- **Real-time Updates**: Game state synchronizes automatically every 2 seconds
- **Waiting Rooms**: Players join games and wait for opponents
- **Player Names**: Personalized experience with custom player names

## 🚀 Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd TicTacToe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Development Mode

For development with auto-restart on file changes:
```bash
npm run dev
```

## 🎯 How to Play

1. **Enter Your Name**: Each player must enter their name to join
2. **Create or Join**: Create a new game or join with an existing Game ID
3. **Wait for Opponent**: Games need 2 players to start
4. **Take Turns**: Only the current player can make moves
5. **Make Moves**: Click on empty cells when it's your turn
6. **Win Conditions**: Get 3 in a row (horizontally, vertically, or diagonally)
7. **Separate Devices**: Each player uses their own device/browser

## 🔧 API Endpoints

The server provides the following REST API endpoints:

### Game Management

- **POST** `/api/game` - Create a new game
- **POST** `/api/game/:gameId/join` - Join a game as a player
- **GET** `/api/game/:gameId` - Get basic game info (for joining)
- **GET** `/api/game/:gameId/player/:playerId` - Get game state for specific player
- **POST** `/api/game/:gameId/move` - Make a move (requires playerId)
- **POST** `/api/game/:gameId/reset` - Reset game (requires playerId)
- **DELETE** `/api/game/:gameId` - Delete game

### Example API Usage

#### Create a New Game
```bash
curl -X POST http://localhost:3000/api/game
```

#### Join a Game
```bash
curl -X POST http://localhost:3000/api/game/{gameId}/join \
  -H "Content-Type: application/json" \
  -d '{"playerName": "Alice"}'
```

#### Make a Move
```bash
curl -X POST http://localhost:3000/api/game/{gameId}/move \
  -H "Content-Type: application/json" \
  -d '{"position": 0, "playerId": "{playerId}"}'
```

#### Get Game State
```bash
curl http://localhost:3000/api/game/{gameId}/player/{playerId}
```

## 🏗️ Project Structure

```
TicTacToe/
├── server.js          # Main server file with game logic
├── package.json       # Project dependencies and scripts
├── public/            # Static files served to browser
│   ├── index.html     # Main HTML page
│   ├── styles.css     # Game styling
│   └── app.js         # Client-side JavaScript
└── README.md          # This file
```

## 🎨 Game Features

### Game Logic
- ✅ Turn-based gameplay (X goes first)
- ✅ Win detection (3 in a row)
- ✅ Draw detection (board full)
- ✅ Move validation
- ✅ Game state management

### User Interface
- ✅ Responsive design
- ✅ Visual feedback for moves
- ✅ Winning line highlighting
- ✅ Current player indication
- ✅ Game status messages
- ✅ Copy to clipboard functionality

### Server Features
- ✅ Multiple concurrent games
- ✅ UUID-based game identification
- ✅ RESTful API design
- ✅ Error handling
- ✅ CORS support

## 🔄 Game Flow

1. **Game Creation**: Server generates unique game ID
2. **Player Joins**: Players connect using game ID
3. **Move Making**: Players alternate making moves
4. **State Updates**: Game state updates in real-time
5. **Game End**: Win/draw detection and notification
6. **Reset/New Game**: Option to restart or create new game

## 🛠️ Customization

### Changing the Port
Set the `PORT` environment variable:
```bash
PORT=8080 npm start
```

### Styling
Modify `public/styles.css` to customize the appearance.

### Game Logic
Edit the `TicTacToeGame` class in `server.js` to modify game rules.

## 🤝 Multiplayer Usage

1. **Player 1**: 
   - Enters their name and creates a new game
   - Gets assigned symbol 'X' (goes first)
   - Shares the Game ID with Player 2

2. **Player 2**: 
   - Enters their name and joins using the Game ID
   - Gets assigned symbol 'O' (goes second)
   - Game starts automatically when both players joined

3. **Gameplay**:
   - Only the current player can make moves
   - Game state updates in real-time for both players
   - Players see whose turn it is
   - Each player has their own game view and perspective

## 📱 Mobile Support

The game is fully responsive and works great on mobile devices:
- Touch-friendly interface
- Optimized layouts for different screen sizes
- Mobile-first design principles

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the port: `PORT=8080 npm start`
   - Or kill the process using port 3000

2. **Game not updating**
   - Check browser console for errors
   - Ensure stable internet connection
   - Try refreshing the page

3. **Can't join game**
   - Verify the Game ID is correct
   - Ensure the game still exists on the server

## 📝 License

MIT License - feel free to use this project for learning and development!

## 🚀 Future Enhancements

Potential improvements for this project:
- [ ] Persistent game storage (database)
- [ ] WebSocket for real-time updates
- [ ] Player authentication
- [ ] Game history and statistics
- [ ] Different board sizes
- [ ] AI opponent option
- [ ] Tournament mode 
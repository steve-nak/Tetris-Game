const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const BLOCK_SIZE = 30;

const PIECES = {
    I: { color: '#00f0f0', blocks: [[0, 0], [1, 0], [2, 0], [3, 0]] },
    O: { color: '#f0f000', blocks: [[0, 0], [1, 0], [0, 1], [1, 1]] },
    T: { color: '#f000f0', blocks: [[1, 0], [0, 1], [1, 1], [2, 1]] },
    S: { color: '#00f000', blocks: [[1, 0], [2, 0], [0, 1], [1, 1]] },
    Z: { color: '#f00000', blocks: [[0, 0], [1, 0], [1, 1], [2, 1]] },
    J: { color: '#0000f0', blocks: [[0, 0], [0, 1], [1, 1], [2, 1]] },
    L: { color: '#f0a000', blocks: [[2, 0], [0, 1], [1, 1], [2, 1]] }
};

const PIECE_NAMES = Object.keys(PIECES);

class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        
        this.currentPiece = null;
        this.nextPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        
        this.setupEventListeners();
        this.drawGrid();
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    startGame() {
        if (this.gameRunning) return;
        this.gameRunning = true;
        this.gamePaused = false;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('gameOverScreen').classList.remove('show');
        
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        this.currentX = Math.floor(GRID_WIDTH / 2) - 1;
        this.currentY = 0;
        
        this.gameLoop();
    }
    
    createPiece() {
        const name = PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
        return { name, rotation: 0 };
    }
    
    gameLoop = (currentTime = 0) => {
        if (!this.gameRunning) return;
        
        if (!this.lastTime) this.lastTime = currentTime;
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (!this.gamePaused) {
            this.dropCounter += deltaTime;
            
            if (this.dropCounter > this.dropInterval) {
                this.dropCounter = 0;
                if (!this.movePiece(0, 1)) {
                    this.placePiece();
                    this.clearLines();
                    this.currentPiece = this.nextPiece;
                    this.nextPiece = this.createPiece();
                    this.currentX = Math.floor(GRID_WIDTH / 2) - 1;
                    this.currentY = 0;
                    
                    if (!this.canMovePiece(this.currentX, this.currentY)) {
                        this.endGame();
                        return;
                    }
                }
            }
            
            this.draw();
        }
        
        requestAnimationFrame(this.gameLoop);
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning || this.gamePaused || this.gameOver) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (this.movePiece(0, 1)) {
                    this.score += 1;
                    this.updateScore();
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotatePiece(1);
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
            case 'z':
            case 'Z':
                e.preventDefault();
                this.rotatePiece(-1);
                break;
            case 'x':
            case 'X':
                e.preventDefault();
                this.rotatePiece(1);
                break;
        }
    }
    
    movePiece(dx, dy) {
        if (this.canMovePiece(this.currentX + dx, this.currentY + dy)) {
            this.currentX += dx;
            this.currentY += dy;
            return true;
        }
        return false;
    }
    
    canMovePiece(x, y) {
        const blocks = this.getPieceBlocks();
        for (let [bx, by] of blocks) {
            const newX = x + bx;
            const newY = y + by;
            
            if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT) {
                return false;
            }
            
            if (newY >= 0 && this.grid[newY][newX] !== null) {
                return false;
            }
        }
        return true;
    }
    
    getPieceBlocks() {
        const piece = PIECES[this.currentPiece.name];
        let blocks = JSON.parse(JSON.stringify(piece.blocks));
        
        for (let i = 0; i < this.currentPiece.rotation; i++) {
            blocks = blocks.map(([x, y]) => [y, -x]);
        }
        
        return blocks;
    }
    
    rotatePiece(direction) {
        const oldRotation = this.currentPiece.rotation;
        this.currentPiece.rotation = (this.currentPiece.rotation + direction + 4) % 4;
        
        if (!this.canMovePiece(this.currentX, this.currentY)) {
            this.currentPiece.rotation = oldRotation;
        }
    }
    
    hardDrop() {
        while (this.movePiece(0, 1)) {
            this.score += 2;
        }
        this.placePiece();
        this.clearLines();
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece();
        this.currentX = Math.floor(GRID_WIDTH / 2) - 1;
        this.currentY = 0;
        
        if (!this.canMovePiece(this.currentX, this.currentY)) {
            this.endGame();
        }
        this.updateScore();
    }
    
    placePiece() {
        const blocks = this.getPieceBlocks();
        const color = PIECES[this.currentPiece.name].color;
        
        for (let [bx, by] of blocks) {
            const x = this.currentX + bx;
            const y = this.currentY + by;
            
            if (y >= 0 && y < GRID_HEIGHT && x >= 0 && x < GRID_WIDTH) {
                this.grid[y][x] = color;
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== null)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(GRID_WIDTH).fill(null));
                linesCleared++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += [40, 100, 300, 1200][linesCleared - 1] * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 50);
            this.updateScore();
        }
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        this.gamePaused = !this.gamePaused;
        document.getElementById('pauseBtn').textContent = this.gamePaused ? 'Resume' : 'Pause';
    }
    
    endGame() {
        this.gameRunning = false;
        this.gameOver = true;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = 'Pause';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').classList.add('show');
    }
    
    restart() {
        this.grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        
        this.updateScore();
        this.draw();
        this.startGame();
    }
    
    drawGrid() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= GRID_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * BLOCK_SIZE, 0);
            this.ctx.lineTo(x * BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= GRID_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    draw() {
        this.drawGrid();
        this.drawPlacedBlocks();
        this.drawCurrentPiece();
        this.drawNext();
    }
    
    drawPlacedBlocks() {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (this.grid[y][x]) {
                    this.ctx.fillStyle = this.grid[y][x];
                    this.ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
                }
            }
        }
    }
    
    drawCurrentPiece() {
        if (!this.currentPiece) return;
        
        const blocks = this.getPieceBlocks();
        const color = PIECES[this.currentPiece.name].color;
        
        this.ctx.fillStyle = color;
        for (let [bx, by] of blocks) {
            const x = this.currentX + bx;
            const y = this.currentY + by;
            
            if (y >= 0 && y < GRID_HEIGHT && x >= 0 && x < GRID_WIDTH) {
                this.ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            }
        }
    }
    
    drawNext() {
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (!this.nextPiece) return;
        
        const piece = PIECES[this.nextPiece.name];
        this.nextCtx.fillStyle = piece.color;
        
        const blockSize = 20;
        const offsetX = (this.nextCanvas.width - blockSize * 4) / 2;
        const offsetY = (this.nextCanvas.height - blockSize * 4) / 2;
        
        for (let [x, y] of piece.blocks) {
            this.nextCtx.fillRect(
                offsetX + x * blockSize + 1,
                offsetY + y * blockSize + 1,
                blockSize - 2,
                blockSize - 2
            );
        }
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new Tetris();
});

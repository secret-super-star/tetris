const COLS = 10, ROWS = 20;
const EMPTY = 0;
const SCORE_TABLE = { 1: 100, 2: 300, 3: 500, 4: 800 };
let bag = [];
let cur = null;
let nextPiece = null;
let score = 0, lines = 0, level = 1;
let dropIntervalPerLevel= 800;
let timer = null;
let paused = false;
let gameOver = false;

const COLORS = { I: 'cI', O: 'cO', T: 'cT', S: 'cS', Z: 'cZ', J: 'cJ', L: 'cL' };

const rotBase = (mat3) => {
    const to4 = (shape) => {
        const topLine = [0, 0, 0, 0];
        return [
            [...topLine],
            [0, ...shape[0]],
            [0, ...shape[1]],
            [0, ...shape[2]],
        ];
    };
    const base = to4(mat3);

    const rotateshapt = (shape) => {
        const shapeRank = shape.length, output = Array.from({ length: shapeRank }, () => Array(shapeRank).fill(0));
        for (let y = 0; y < shapeRank; y++) for (let x = 0; x < shapeRank; x++) output[x][shapeRank - 1 - y] = shape[y][x];
        return output;
    };
    return [base, rotateshapt(base), rotateshapt(rotateshapt(base)), rotateshapt(rotateshapt(rotateshapt(base)))];
}

const SHAPES = {
    L: rotBase([[0, 0, 1], [1, 1, 1], [0, 0, 0]]),
    S: rotBase([[0, 1, 1], [1, 1, 0], [0, 0, 0]]),
    T: rotBase([[0, 1, 0], [1, 1, 1], [0, 0, 0]]),
    J: rotBase([[1, 0, 0], [1, 1, 1], [0, 0, 0]]),
    Z: rotBase([[1, 1, 0], [0, 1, 1], [0, 0, 0]]),
    O: [
        [[0, 0, 0, 0], [0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
    ],
    I: [
        [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
        [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
        [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
    ]
};

const createInitGameBoard = () => { return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY)); }

let board = createInitGameBoard();

const makeNewBag = () => {
    const shuffledShape = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

    //Make array to random using fisher-yates algorithm>>>>>
    for (let i = shuffledShape.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [shuffledShape[i], shuffledShape[j]] = [shuffledShape[j], shuffledShape[i]];
    }
    bag = shuffledShape;
}


const spawn = () => {
    if (bag.length === 0) makeNewBag();
    const TYPE = nextPiece ?? bag.pop();

    cur = { type: TYPE, x: 3, y: 0, r: 0 };

    if (bag.length === 0) makeNewBag();
    nextPiece = bag.pop()


    if (!canPlace(cur.type, cur.x, cur.y, cur.r)) {
        gameOver = true;
        stop();
        alert("Game Over!!!!!!!");
    }
    drawShapeToNextPieceBoard();
}


const drawShapeToNextPieceBoard = () => {
    const type = nextPiece;
    const shape = SHAPES[type][0];
    drawNextStepShape(nextPieceBoard, shape, COLORS[type], shape[0].length, shape.length);
}

const drawNextStepShape = (nextPieceBoard, shape, colorClass, gridW, gridH) => {
    const cells = nextPieceBoard.children;
    for (let i = 0; i < gridW * gridH; i++) cells[i].className = 'cell';
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const indexOfCell = y * gridW + x;
                const cell = cells[indexOfCell];
                if (cell) cell.className = `cell ${colorClass}`;
            }
        }
    }
}


const shapeAtRoate = (type, r) => { return SHAPES[type][r % SHAPES[type].length]; }

const rotateCW = () => {
    if (gameOver || paused) return;
    const nr = (cur.r + 1) % SHAPES[cur.type].length;
    const kicks = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0]];
    for (const [kx, ky] of kicks) {
        if (canPlace(cur.type, cur.x + kx, cur.y + ky, nr)) {
            cur.r = nr; cur.x += kx; cur.y += ky; render(); return;
        }
    }
}

const canPlace = (type, x, y, r) => {
    let shape = shapeAtRoate(type, r)
    for (let sy = 0; sy < shape.length; sy++) {
        for (let sx = 0; sx < shape[sy].length; sx++) {
            if (!shape[sy][sx]) continue;
            const nx = x + sx, ny = y + sy;
            if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false;
            if (board[ny][nx] !== EMPTY) return false;
        }
    }
    return true
}

const lockPiece = () => {
    const s = shapeAtRoate(cur.type, cur.r);
    for (let sy = 0; sy < s.length; sy++) {
        for (let sx = 0; sx < s[sy].length; sx++) {
            if (!s[sy][sx]) continue;
            const nx = cur.x + sx, ny = cur.y + sy;
            if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
                board[ny][nx] = cur.type;
            }
        }
    }
    const cleared = clearLines();
    if (cleared > 0) {
        score += SCORE_TABLE[cleared] || 0;
        lines += cleared;

        const newLevel = Math.floor(lines / 10) + 1;
        if (newLevel !== level) {
            level = newLevel;
            dropIntervalPerLevel = Math.max(120, 800 - (level - 1) * 60);
            restartLoopIfRunning();
        }
        updateStats();
    }
    spawn();
    render();
}


const clearLines = () => {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(value => value !== EMPTY)) {

            board.splice(y, 1);
            board.unshift(Array(COLS).fill(EMPTY));
            cleared++; y++;
        }
    }
    return cleared;
}

const tick = () => {
    if (paused || gameOver) return;

    if (!move(0, 1)) lockPiece();
}

document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    switch (e.key) {
        case 'a': move(-1, 0); break;
        case 'd': move(1, 0); break;
        case 'f': move(0, 1); break;
        case 's': rotateCW(); break;
        case 'z': e.preventDefault(); hardDrop(); break;
        case 'p': case 'P': togglePause(); break;
        case 'r': case 'R': reset(); start(); break;
    }
});

const move = (dx, dy) => {
    if (gameOver || paused) return;
    console.log(cur, '🤣🤣🤣🤣🤣🤣')
    const nx = cur.x + dx, ny = cur.y + dy;
    if (canPlace(cur.type, nx, ny, cur.r)) {
        cur.x = nx; cur.y = ny; render();
        return true;
    }
    return false;
}

const hardDrop = () => {
    if (gameOver || paused) return;
    while (move(0, 1)) { }
    lockPiece();
}

const togglePause = () => {
    if (paused) {
        paused = false;

        restartLoopIfRunning();
    }
    else {
        paused = true; stop();
    }
    console.log(paused)
}

const stop = () => {
    clearInterval(timer); timer = null;
}
const restartLoopIfRunning = () => {
    stop(); timer = setInterval(tick, dropIntervalPerLevel);

}

const reset = () => {
    stop();
    board = createInitGameBoard();
    bag = []; cur = null; nextPiece = null;
    score = 0; lines = 0; level = 1; dropIntervalPerLevel = 800;
    paused = false; gameOver = false;
    updateStats();
    buildBoardDOM();
    buildNextDOM();
}

const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');

const updateStats = () => {
    scoreEl.textContent = score;
    linesEl.textContent = lines;
    levelEl.textContent = level;
}

const start = () => {
    if (timer) return;
    if (!cur) { makeNewBag(); spawn(); }
    paused = false; gameOver = false;
    timer = setInterval(tick, dropIntervalPerLevel);
}


let mainGameBoard = document.getElementById("game-board")
let nextPieceBoard = document.getElementById("nextPiece-board")
const buildBoardDOM = () => {
    mainGameBoard.innerHTML = '';
    for (let i = 0; i < ROWS * COLS; i++) {
        const d = document.createElement('div');
        d.className = 'cell';
        mainGameBoard.appendChild(d);
    }
}


const buildNextDOM = () => {
    nextPieceBoard.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const d = document.createElement('div');
        d.className = 'cell';
        nextPieceBoard.appendChild(d);
    }
}


const render = () => {
    const cells = mainGameBoard.children;
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const idx = y * COLS + x;
            const el = cells[idx];
            const v = board[y][x];
            el.className = 'cell ' + (v ? COLORS[v] : '');
        }
    }
    const s = shapeAtRoate(cur.type, cur.r);
    for (let sy = 0; sy < s.length; sy++) {
        for (let sx = 0; sx < s[sy].length; sx++) {
            if (!s[sy][sx]) continue;
            const nx = cur.x + sx, ny = cur.y + sy;
            if (ny >= 0) {
                const idx = ny * COLS + nx;
                const el = cells[idx];
                if (el) el.classList.add(COLORS[cur.type]);
            }
        }
    }
}

document.getElementById('startBtn').onclick = () => {
    if (!cur) reset();
    start();
};
document.getElementById('pauseBtn').onclick = () => togglePause();



updateStats();
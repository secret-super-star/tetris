(function () {
    const COLS = 10;
    const ROWS = 20;
    const BLOCK = 24;
    const EMPTY = 0;
    const COLORS = { I: "#5ce1e6", J: "#5c7cff", L: "#ff9f5c", O: "#ffd166", S: "#39d98a", T: "#b084ff", Z: "#ff5c7a" };
    const SHAPES = {
        I: [
            [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
            [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
            [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
            [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
        ],
        J: [
            [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
            [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
        ],
        L: [
            [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
            [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
            [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
        ],
        O: [[[1, 1], [1, 1]], [[1, 1], [1, 1]], [[1, 1], [1, 1]], [[1, 1], [1, 1]]],
        S: [
            [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
            [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
            [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
        ],
        T: [
            [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
            [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
        ],
        Z: [
            [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
            [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
            [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
        ],
    };

    function createMatrix(cols, rows) { return Array.from({ length: rows }, () => Array(cols).fill(EMPTY)); }
    function cloneMatrix(m) { return m.map(r => r.slice()); }
    function bagRandomizer() { const types = Object.keys(SHAPES); let bag = []; function refill() { bag = types.slice(); for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[bag[i], bag[j]] = [bag[j], bag[i]]; } } refill(); return () => { if (!bag.length) refill(); return bag.pop(); }; }
    function merge(board, piece) { for (let y = 0; y < piece.shape.length; y++) { for (let x = 0; x < piece.shape[y].length; x++) { if (piece.shape[y][x]) { const by = y + piece.y, bx = x + piece.x; if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) board[by][bx] = piece.type; } } } }
    function collide(board, piece) { for (let y = 0; y < piece.shape.length; y++) { for (let x = 0; x < piece.shape[y].length; x++) { if (!piece.shape[y][x]) continue; const by = y + piece.y, bx = x + piece.x; if (bx < 0 || bx >= COLS || by >= ROWS) return true; if (by >= 0 && board[by][bx] !== EMPTY) return true; } } return false; }
    function clearLines(board) { let cleared = 0; outer: for (let y = ROWS - 1; y >= 0; y--) { for (let x = 0; x < COLS; x++) if (board[y][x] === EMPTY) continue outer; board.splice(y, 1); board.unshift(Array(COLS).fill(EMPTY)); cleared++; y++; } return cleared; }
    function scoreFor(lines) { switch (lines) { case 1: return 100; case 2: return 300; case 3: return 500; case 4: return 800; default: return 0; } }
    function createPiece(nextGen) { const type = nextGen(); return { type, rot: 0, shape: SHAPES[type][0], x: 3, y: -2 }; }
    function ghostY(board, piece) { const t = { ...piece }; while (!collide(board, { ...t, y: t.y + 1 })) t.y++; return t.y; }
    function drawBoard(ctx, board) { ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (board[y][x] !== EMPTY) drawBlock(ctx, x, y, COLORS[board[y][x]]); }
    function drawBlock(ctx, x, y, color, alpha = 1) { const px = x * 24, py = y * 24; ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillRect(px, py, 24, 24); ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(px, py, 24, 3); ctx.fillRect(px, py, 3, 24); ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fillRect(px, py + 21, 24, 3); ctx.fillRect(px + 21, py, 3, 24); ctx.globalAlpha = 1; }
    function drawPiece(ctx, p, gy) { if (gy != null) { for (let y = 0; y < p.shape.length; y++) for (let x = 0; x < p.shape[y].length; x++) if (p.shape[y][x]) drawBlock(ctx, p.x + x, gy + y, COLORS[p.type], 0.15); } for (let y = 0; y < p.shape.length; y++) for (let x = 0; x < p.shape[y].length; x++) if (p.shape[y][x]) drawBlock(ctx, p.x + x, p.y + y, COLORS[p.type]); }
    function drawNext(ctx, type) { ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); if (!type) return; const shape = SHAPES[type][0], color = COLORS[type]; const offsetX = Math.floor((4 - shape[0].length) * 0.5); for (let y = 0; y < shape.length; y++) for (let x = 0; x < shape[y].length; x++) if (shape[y][x]) { const px = (x + offsetX) * 16 + 12, py = y * 16 + 10; ctx.fillStyle = color; ctx.fillRect(px, py, 16, 16); ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(px, py, 16, 2); ctx.fillRect(px, py, 2, 16); ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fillRect(px, py + 14, 16, 2); ctx.fillRect(px + 14, py, 2, 16); } }

    function createGame(canvas, nextCanvas, scoreEl, linesEl, levelEl, overlayEl, isBot, hooks) {
        const ctx = canvas.getContext("2d"); ctx.imageSmoothingEnabled = false;
        const nextCtx = nextCanvas.getContext("2d");
        const rand = bagRandomizer();
        let board = createMatrix(COLS, ROWS);
        let current = createPiece(rand);
        let next = createPiece(rand).type;
        let dropCounter = 0, dropInterval = 1000, lastTime = 0;
        let running = false, gameOver = false;
        let score = 0, lines = 0, level = 1;
        let botPlan = null, botMoveTimer = 0;

        function updateHUD() { scoreEl.textContent = score; linesEl.textContent = lines; levelEl.textContent = level; hooks?.onState?.({ score, lines, level }); }
        function spawn() { current = { type: next, rot: 0, shape: SHAPES[next][0], x: 3, y: -2 }; next = createPiece(rand).type; drawNext(nextCtx, next); if (collide(board, current)) { running = false; gameOver = true; overlayEl.classList.add("show"); overlayEl.textContent = "GAME OVER"; hooks?.onGameOver?.({ score, lines, level }); } if (isBot) botPlan = null; }
        function setLevel() { const newLevel = Math.floor(lines / 10) + 1; if (newLevel !== level) { level = newLevel; if (!isBot) { dropInterval = Math.max(120, 1000 - (level - 1) * 90); } } }
        function hardDrop() { while (!collide(board, { ...current, y: current.y + 1 })) current.y++; lockPiece(); }
        function lockPiece() { merge(board, current); const cleared = clearLines(board); if (cleared) { score += scoreFor(cleared) * level; lines += cleared; setLevel(); } spawn(); updateHUD(); }
        function move(dir) { const t = { ...current, x: current.x + dir }; if (!collide(board, t)) current = t; }
        function rotate(dir) { const nr = (current.rot + (dir > 0 ? 1 : 3)) % 4; const r = { ...current, rot: nr, shape: SHAPES[current.type][nr] }; for (const k of [0, -1, 1, -2, 2]) { const t = { ...r, x: current.x + k }; if (!collide(board, t)) { current = t; return; } } }
        function drop() { const t = { ...current, y: current.y + 1 }; if (!collide(board, t)) current = t; else lockPiece(); }
        function draw() { drawBoard(ctx, board); const gy = ghostY(board, current); drawPiece(ctx, current, gy); }
        function update(time = 0) {
            if (!running) { lastTime = time; requestAnimationFrame(update); return; }
            const delta = time - lastTime; lastTime = time;
            // Sync bot fall speed from slider in real time
            if (isBot) { const s = Number(document.getElementById("botSpeed").value); dropInterval = Math.max(60, s || 300); }
            dropCounter += delta;
            if (dropCounter > dropInterval) { drop(); dropCounter = 0; }
            draw();
            if (isBot && !gameOver) botUpdate(delta);
            requestAnimationFrame(update);
        }
        function evaluate(bd) { const heights = Array(COLS).fill(0); for (let x = 0; x < COLS; x++) { for (let y = 0; y < ROWS; y++) if (bd[y][x] !== EMPTY) { heights[x] = ROWS - y; break; } } let holes = 0; for (let x = 0; x < COLS; x++) { let seen = false; for (let y = 0; y < ROWS; y++) { if (bd[y][x] !== EMPTY) seen = true; else if (seen) holes++; } } let bump = 0; for (let x = 0; x < COLS - 1; x++) bump += Math.abs(heights[x] - heights[x + 1]); let agg = heights.reduce((a, b) => a + b, 0); let linesC = 0; for (let y = 0; y < ROWS; y++) if (bd[y].every(v => v !== EMPTY)) linesC++; return { aggregateHeight: agg, holes, bumpiness: bump, linesCleared: linesC }; }
        function bScore(e, d) { const W = { easy: { h: -0.45, holes: -0.9, bump: -0.15, lines: 1.0 }, medium: { h: -0.52, holes: -1.0, bump: -0.25, lines: 1.4 }, hard: { h: -0.58, holes: -1.2, bump: -0.35, lines: 1.8 } }; const w = W[d] || W.medium; return e.aggregateHeight * w.h + e.holes * w.holes + e.bumpiness * w.bump + e.linesCleared * w.lines; }
        function computePlan() { const diff = document.getElementById("botDifficulty").value; let best = null; for (let rot = 0; rot < 4; rot++) { const shape = SHAPES[current.type][rot]; for (let x = -2; x < COLS; x++) { const test = { type: current.type, rot, shape, x, y: -2 }; while (!collide(board, { ...test, y: test.y + 1 })) test.y++; if (collide(board, test)) continue; const bd = cloneMatrix(board); merge(bd, test); const cleared = clearLines(bd); const ev = evaluate(bd); ev.linesCleared = cleared; const s = bScore(ev, diff); if (!best || s > best.score) best = { score: s, rot, x }; } } return best; }
        function botUpdate(delta) { if (!botPlan) botPlan = computePlan(); if (!botPlan) return; const speed = Number(document.getElementById("botSpeed").value); botMoveTimer += delta; const step = Math.max(70, speed); if (botMoveTimer >= step) { botMoveTimer = 0; if (current.rot !== botPlan.rot) rotate(1); else if (current.x < botPlan.x) move(1); else if (current.x > botPlan.x) move(-1); else { if (!collide(board, { ...current, y: current.y + 1 })) current.y += 1; else lockPiece(); } } }
        function start() { if (gameOver) return; running = true; overlayEl.classList.remove("show"); }
        function pause() { running = false; }
        function restart() { board = createMatrix(COLS, ROWS); current = createPiece(rand); next = createPiece(rand).type; lastTime = 0; dropCounter = 0; dropInterval = isBot ? Math.max(60, Number(document.getElementById("botSpeed").value) || 300) : 1000; score = 0; lines = 0; level = 1; running = false; gameOver = false; botPlan = null; botMoveTimer = 0; updateHUD(); drawNext(nextCtx, next); overlayEl.classList.add("show"); overlayEl.textContent = "PAUSED"; hooks?.onRestart?.(); }
        return { update, start, pause, restart, move, rotate, drop, hardDrop, get state() { return { running, gameOver, score, lines, level }; } };
    }

    // Create games with hooks
    const modal = document.getElementById('matchModal');
    const winnerText = document.getElementById('winnerText');
    const mhScore = document.getElementById('mhScore');
    const mbScore = document.getElementById('mbScore');
    let finished = false;

    function openModal(h, b) { mhScore.textContent = h; mbScore.textContent = b; if (h > b) { winnerText.textContent = 'Human wins!'; } else if (b > h) { winnerText.textContent = 'Bot wins!'; } else { winnerText.textContent = 'Draw!'; } modal.classList.add('show'); }
    function closeModal() { modal.classList.remove('show'); }

    const human = createGame(
        document.getElementById('humanBoard'),
        document.getElementById('hNext'),
        document.getElementById('hScore'),
        document.getElementById('hLines'),
        document.getElementById('hLevel'),
        document.getElementById('humanOverlay'),
        false,
        {
            onGameOver: ({ score }) => { if (!finished) { finished = true; bot.pause(); human.pause(); openModal(score, Number(document.getElementById('bScore').textContent)); } },
        }
    );
    human.update();

    const bot = createGame(
        document.getElementById('botBoard'),
        document.getElementById('bNext'),
        document.getElementById('bScore'),
        document.getElementById('bLines'),
        document.getElementById('bLevel'),
        document.getElementById('botOverlay'),
        true,
        {
            onGameOver: ({ score }) => { if (!finished) { finished = true; bot.pause(); human.pause(); openModal(Number(document.getElementById('hScore').textContent), score); } },
        }
    );
    bot.update();

    document.getElementById('startBtn').addEventListener('click', () => { closeModal(); finished = false; human.start(); bot.start(); document.getElementById('humanOverlay').classList.remove('show'); document.getElementById('botOverlay').classList.remove('show'); });
    document.getElementById('pauseBtn').addEventListener('click', () => { human.pause(); bot.pause(); document.getElementById('humanOverlay').classList.add('show'); document.getElementById('humanOverlay').textContent = 'PAUSED'; document.getElementById('botOverlay').classList.add('show'); document.getElementById('botOverlay').textContent = 'PAUSED'; });
    document.getElementById('restartBtn').addEventListener('click', () => { closeModal(); finished = false; human.restart(); bot.restart(); });
    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('modalPlayBtn').addEventListener('click', () => { closeModal(); human.restart(); bot.restart(); human.start(); bot.start(); });

    // Human controls
    window.addEventListener('keydown', (e) => {
        const { running, gameOver } = human.state; if (!running || gameOver) return;
        switch (e.code) {
            case 'ArrowLeft': e.preventDefault(); human.move(-1); break;
            case 'ArrowRight': e.preventDefault(); human.move(1); break;
            case 'ArrowUp': e.preventDefault(); human.rotate(1); break;
            case 'ArrowDown': e.preventDefault(); human.drop(); break;
            case 'Space': e.preventDefault(); human.hardDrop(); break;
        }
    });

    document.getElementById('humanOverlay').classList.add('show');
    document.getElementById('humanOverlay').textContent = 'PRESS START';
    document.getElementById('botOverlay').classList.add('show');
    document.getElementById('botOverlay').textContent = 'PRESS START';
})();
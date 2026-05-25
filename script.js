/* ══════════════════════════════════════════
   CYBER ARENA — script.js
   Mobile Game Engine
══════════════════════════════════════════ */

// ── CANVAS SETUP ──────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const W = 360;   // logical width
const H = 520;   // logical height
canvas.width  = W;
canvas.height = H;

// ── GAME STATE ────────────────────────────
let score    = 0;
let hiScore  = 0;
let health   = 100;
let level    = 1;
let running  = false;
let paused   = false;
let soundOn  = true;
let animId   = null;

// ── KEYBOARD INPUT ────────────────────────
const keys = {};

window.addEventListener('keydown', e => {
  keys[e.code] = true;
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
});

// Keyboard shortcuts
window.addEventListener('keydown', e => {
  if (e.code === 'Escape') togglePause();
  if (e.code === 'Enter' && !running) startGame();
});

/**
 * pressKey — called by D-pad & fire button touch events
 * @param {string}  code  - KeyboardEvent.code equivalent
 * @param {boolean} down  - true = pressed, false = released
 */
function pressKey(code, down) {
  keys[code] = down;

  // Visual pressed feedback on D-pad buttons
  const map = {
    ArrowUp:    'dUp',
    ArrowDown:  'dDown',
    ArrowLeft:  'dLeft',
    ArrowRight: 'dRight'
  };

  if (map[code]) {
    document.getElementById(map[code])
      ?.classList.toggle('pressed', down);
  }
}

// ── ENTITY VARIABLES ──────────────────────
let player, bullets, enemies, particles2, stars;

/**
 * initEntities — resets all game objects to starting state
 */
function initEntities() {
  player = {
    x: W / 2 - 18,
    y: H - 80,
    w: 36,
    h: 36,
    speed: 4,
    shootCooldown: 0
  };

  bullets    = [];
  enemies    = [];
  particles2 = [];

  // Generate starfield
  stars = Array.from({ length: 60 }, () => ({
    x:      Math.random() * W,
    y:      Math.random() * H,
    r:      Math.random() * 1.5 + 0.3,
    speed:  Math.random() * 1.5 + 0.3,
    bright: Math.random()
  }));

  score  = 0;
  health = 100;
  level  = 1;
  updateHUD();
}

// ── SPAWN CONTROL ─────────────────────────
let spawnTimer = 0;
let spawnRate  = 90;   // frames between enemy spawns (lower = faster)

// ══════════════════════════════════════════
//   DRAW FUNCTIONS
// ══════════════════════════════════════════

/** Scroll stars downward to create flying-through-space effect */
function drawStars() {
  stars.forEach(s => {
    ctx.fillStyle = `rgba(255,255,255,${0.3 + s.bright * 0.6})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();

    s.y += s.speed;
    if (s.y > H) {
      s.y = 0;
      s.x = Math.random() * W;
    }
  });
}

/** Draw the player's ship with cyan neon glow */
function drawPlayer(p) {
  ctx.shadowColor = '#00fff7';
  ctx.shadowBlur  = 18;
  ctx.strokeStyle = '#00fff7';
  ctx.lineWidth   = 2;

  // Ship shape (pointed upward)
  ctx.beginPath();
  ctx.moveTo(p.x + p.w / 2,       p.y);
  ctx.lineTo(p.x + p.w,           p.y + p.h);
  ctx.lineTo(p.x + p.w * 0.7,     p.y + p.h * 0.75);
  ctx.lineTo(p.x + p.w / 2,       p.y + p.h * 0.85);
  ctx.lineTo(p.x + p.w * 0.3,     p.y + p.h * 0.75);
  ctx.lineTo(p.x,                  p.y + p.h);
  ctx.closePath();

  const g = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
  g.addColorStop(0, '#00fff7');
  g.addColorStop(1, '#0044ff');

  ctx.fillStyle = g;
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
}

/** Draw all player bullets */
function drawBullets() {
  bullets.forEach(b => {
    ctx.shadowColor = '#00fff7';
    ctx.shadowBlur  = 10;

    const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
    g.addColorStop(0, '#fff');
    g.addColorStop(1, '#00fff7');
    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

/** Draw all enemies (inverted ships in pink/purple) */
function drawEnemies() {
  enemies.forEach(e => {
    ctx.shadowColor = '#ff00c8';
    ctx.shadowBlur  = 14;
    ctx.strokeStyle = '#ff00c8';
    ctx.lineWidth   = 2;

    // Enemy shape (pointed downward)
    ctx.beginPath();
    ctx.moveTo(e.x + e.w / 2,     e.y + e.h);
    ctx.lineTo(e.x + e.w,         e.y);
    ctx.lineTo(e.x + e.w * 0.7,   e.y + e.h * 0.25);
    ctx.lineTo(e.x + e.w / 2,     e.y + e.h * 0.15);
    ctx.lineTo(e.x + e.w * 0.3,   e.y + e.h * 0.25);
    ctx.lineTo(e.x,                e.y);
    ctx.closePath();

    const g = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.h);
    g.addColorStop(0, '#ff00c8');
    g.addColorStop(1, '#7700ff');

    ctx.fillStyle = g;
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
  });
}

/** Draw explosion / hit particle effects */
function drawParticles() {
  particles2.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle   = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
  ctx.shadowBlur  = 0;
}

// ══════════════════════════════════════════
//   SPAWN HELPERS
// ══════════════════════════════════════════

/** Spawn a single player bullet at ship's tip */
function spawnBullet() {
  bullets.push({
    x:     player.x + player.w / 2 - 2,
    y:     player.y,
    w:     4,
    h:     14,
    speed: 9
  });
}

/** Spawn an enemy at a random x position above screen */
function spawnEnemy() {
  const x = Math.random() * (W - 36);
  enemies.push({
    x,
    y:     -36,
    w:     36,
    h:     36,
    speed: 1.2 + level * 0.3
  });
}

/**
 * Spawn burst of particles at (x, y)
 * @param {number} x
 * @param {number} y
 * @param {string} color  - CSS color string
 */
function spawnParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles2.push({
      x, y,
      vx:    Math.cos(angle) * speed,
      vy:    Math.sin(angle) * speed,
      life:  1,
      color,
      r:     Math.random() * 3 + 1
    });
  }
}

// ══════════════════════════════════════════
//   COLLISION
// ══════════════════════════════════════════

/**
 * Axis-Aligned Bounding Box collision check
 * @param {{x,y,w,h}} a
 * @param {{x,y,w,h}} b
 * @returns {boolean}
 */
function hits(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// ══════════════════════════════════════════
//   HUD UPDATE
// ══════════════════════════════════════════

function updateHUD() {
  document.getElementById('scoreDisplay').textContent = score;
  document.getElementById('hiDisplay').textContent    = hiScore;
  document.getElementById('healthFill').style.width   = health + '%';
  document.getElementById('levelBadge').textContent   =
    'LV ' + String(level).padStart(2, '0');
}

// ══════════════════════════════════════════
//   MAIN GAME LOOP
// ══════════════════════════════════════════

function loop() {
  if (!running) return;

  if (!paused) {
    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#04020f';
    ctx.fillRect(0, 0, W, H);
    drawStars();

    // ── Player movement ──
    const p = player;
    if ((keys['ArrowLeft']  || keys['KeyA']) && p.x > 0)        p.x -= p.speed;
    if ((keys['ArrowRight'] || keys['KeyD']) && p.x + p.w < W)  p.x += p.speed;
    if ((keys['ArrowUp']    || keys['KeyW']) && p.y > 0)        p.y -= p.speed;
    if ((keys['ArrowDown']  || keys['KeyS']) && p.y + p.h < H)  p.y += p.speed;

    // ── Shooting ──
    p.shootCooldown--;
    if ((keys['Space'] || keys['KeyZ']) && p.shootCooldown <= 0) {
      spawnBullet();
      p.shootCooldown = 12;   // frames between shots
    }

    // ── Bullet movement ──
    bullets.forEach(b => { b.y -= b.speed; });
    bullets = bullets.filter(b => b.y > -b.h);

    // ── Enemy spawning ──
    spawnTimer++;
    if (spawnTimer >= spawnRate) {
      spawnEnemy();
      spawnTimer = 0;
    }
    spawnRate = Math.max(30, 90 - level * 8);   // get faster per level

    // ── Enemy movement ──
    enemies.forEach(e => { e.y += e.speed; });

    // ── Collision: bullet hits enemy ──
    for (let i = bullets.length - 1; i >= 0; i--) {
      for (let j = enemies.length - 1; j >= 0; j--) {
        if (hits(bullets[i], enemies[j])) {
          spawnParticles(enemies[j].x + 18, enemies[j].y + 18, '#ff00c8');
          bullets.splice(i, 1);
          enemies.splice(j, 1);

          score += 10;
          if (score > hiScore) hiScore = score;
          level = Math.floor(score / 100) + 1;

          updateHUD();
          break;
        }
      }
    }

    // ── Collision: enemy hits player ──
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (enemies[j].y > H) {
        enemies.splice(j, 1);
        continue;
      }
      if (hits(player, enemies[j])) {
        spawnParticles(enemies[j].x + 18, enemies[j].y + 18, '#ff4400');
        enemies.splice(j, 1);
        health = Math.max(0, health - 20);
        updateHUD();

        if (health <= 0) {
          gameOver();
          return;
        }
      }
    }

    // ── Particle physics ──
    particles2.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
    });
    particles2 = particles2.filter(p => p.life > 0);

    // ── Draw everything ──
    drawPlayer(p);
    drawBullets();
    drawEnemies();
    drawParticles();

    // Watermark on canvas
    ctx.font      = 'bold 11px Orbitron';
    ctx.fillStyle = 'rgba(0,255,247,0.4)';
    ctx.fillText('CYBER ARENA', 8, 16);
  }

  animId = requestAnimationFrame(loop);
}

// ══════════════════════════════════════════
//   GAME CONTROL FUNCTIONS
// ══════════════════════════════════════════

/** Start fresh game */
function startGame() {
  document.getElementById('startOverlay').classList.add('hidden');
  initEntities();
  running = true;
  loop();
}

/** Restart after game over */
function restartGame() {
  document.getElementById('overOverlay').classList.add('hidden');
  initEntities();
  running = true;
  loop();
}

/** Trigger Game Over screen */
function gameOver() {
  running = false;
  cancelAnimationFrame(animId);
  document.getElementById('finalScore').textContent = 'YOUR SCORE: ' + score;
  document.getElementById('overOverlay').classList.remove('hidden');
}

/** Toggle pause/resume */
function togglePause() {
  paused = !paused;
  document.getElementById('pauseBtn').textContent = paused ? '▶ RESUME' : '⏸ PAUSE';
  if (!paused && running) loop();
}

/** Toggle sound on/off */
function toggleSound() {
  soundOn = !soundOn;
  document.getElementById('soundBtn').textContent =
    soundOn ? '🔊 SOUND ON' : '🔇 SOUND OFF';
}
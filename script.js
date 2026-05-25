const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const gameOverScreen = document.getElementById("gameOver");
const homeScreen = document.getElementById("homeScreen");
const scoreEl = document.getElementById("score");
const finalScore = document.getElementById("finalScore");
const highScoreEl = document.getElementById("highScore");
const healthEl = document.getElementById("health");
const hud = document.getElementById("hud");

let gameRunning = false;
let score = 0;
let health = 100;
let level = 1;

let highScore = localStorage.getItem("highScore") || 0;
highScoreEl.innerText = highScore;

/* Player */
const player = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  radius: 25,
  color: "cyan",
  speed: 7
};

let bullets = [];
let enemies = [];
let particles = [];

/* Controls */
const keys = {};

window.addEventListener("keydown", e => {
  keys[e.key] = true;
});

window.addEventListener("keyup", e => {
  keys[e.key] = false;
});

/* Start Game */
startBtn.onclick = () => {
  homeScreen.style.display = "none";
  hud.style.display = "flex";
  gameRunning = true;
  spawnEnemies();
  animate();
};

restartBtn.onclick = () => {
  location.reload();
};

/* Shoot */
function shoot() {
  bullets.push({
    x: player.x,
    y: player.y,
    radius: 5,
    color: "magenta",
    speed: 10
  });
}

window.addEventListener("click", shoot);

/* Enemy Spawn */
function spawnEnemies() {
  setInterval(() => {
    if (!gameRunning) return;

    enemies.push({
      x: Math.random() * canvas.width,
      y: -50,
      radius: 20,
      color: "red",
      speed: 2 + level * 0.3
    });

  }, 1000);
}

/* Collision */
function collision(a, b) {
  const dist = Math.hypot(a.x - b.x, a.y - b.y);
  return dist < a.radius + b.radius;
}

/* Particles */
function createExplosion(x, y) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x,
      y,
      radius: Math.random() * 3,
      dx: (Math.random() - 0.5) * 5,
      dy: (Math.random() - 0.5) * 5,
      alpha: 1
    });
  }
}

/* Animate */
function animate() {
  if (!gameRunning) return;

  requestAnimationFrame(animate);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* Background Particles */
  particles.forEach((p, index) => {
    p.x += p.dx;
    p.y += p.dy;
    p.alpha -= 0.02;

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (p.alpha <= 0) {
      particles.splice(index, 1);
    }
  });

  /* Player */
  ctx.beginPath();
  ctx.fillStyle = player.color;
  ctx.shadowBlur = 20;
  ctx.shadowColor = "cyan";
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  /* Movement */
  if (keys["ArrowLeft"] || keys["a"]) {
    player.x -= player.speed;
  }

  if (keys["ArrowRight"] || keys["d"]) {
    player.x += player.speed;
  }

  /* Bullets */
  bullets.forEach((bullet, bIndex) => {
    bullet.y -= bullet.speed;

    ctx.beginPath();
    ctx.fillStyle = bullet.color;
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();

    enemies.forEach((enemy, eIndex) => {
      if (collision(bullet, enemy)) {

        createExplosion(enemy.x, enemy.y);

        enemies.splice(eIndex, 1);
        bullets.splice(bIndex, 1);

        score += 10;
        scoreEl.innerText = score;

        if (score > highScore) {
          localStorage.setItem("highScore", score);
          highScoreEl.innerText = score;
        }

        if (score % 100 === 0) {
          level++;
        }
      }
    });
  });

  /* Enemies */
  enemies.forEach((enemy, index) => {
    enemy.y += enemy.speed;

    ctx.beginPath();
    ctx.fillStyle = enemy.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "red";
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    if (collision(player, enemy)) {
      enemies.splice(index, 1);

      health -= 10;

      healthEl.style.width = health + "%";

      if (health <= 0) {
        gameOver();
      }
    }
  });
}

/* Game Over */
function gameOver() {
  gameRunning = false;

  finalScore.innerText = score;

  gameOverScreen.classList.remove("hidden");
}

/* Resize */
window.addEventListener("resize", () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
});

/* Loading */
window.onload = () => {
  setTimeout(() => {
    document.getElementById("loadingScreen").style.display = "none";
  }, 2000);
};
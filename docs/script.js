const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const img = new Image();
img.src = "https://i.ibb.co/Q9yv5Jk/flappy-bird-set.png";

let bird = { x: 50, y: canvas.height / 2, radius: 15, velocity: 0, started: false };
const gravity = 0.5;
const jumpStrength = -8;
const pipeGap = 150;  
let pipes = [];
const size = [51, 36];
const pipeWidth = 78;
const pipeDistance = 250;
const pipeLoc = () => (Math.random() * ((canvas.height - (pipeGap + pipeWidth)) - pipeWidth)) + pipeWidth;
let index = 0;
let score = 0;
let bestScore = localStorage.getItem("bestScore") || 0;

let isPageReloaded = false;

if (performance.navigation.type === 1) {
    isPageReloaded = true;
    bestScore = 0;
    localStorage.setItem("bestScore", bestScore);
}

function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.started = false;
    pipes = Array(3).fill().map((a, i) => [canvas.width + (i * (pipeGap + pipeWidth + pipeDistance / 2)), pipeLoc()]);
    score = 0;
    updateScoreDisplay();
}

document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        if (!bird.started) {
            bird.started = true;
        }
        bird.velocity = jumpStrength;
    }
});

function checkCollision() {
    if (
        bird.y - bird.radius <= 0 || 
        bird.y + bird.radius >= canvas.height ||
        pipes.some(pipe => 
            bird.x + bird.radius > pipe[0] && bird.x - bird.radius < pipe[0] + pipeWidth &&
            (bird.y - bird.radius < pipe[1] || bird.y + bird.radius > pipe[1] + pipeGap)
        )
    ) {
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem("bestScore", bestScore);
        }
        resetGame();
    }
}

function update() {
    if (!bird.started) return;

    bird.velocity += gravity;
    bird.y += bird.velocity;

    if (bird.y + bird.radius >= canvas.height) {
        bird.y = canvas.height - bird.radius;
        bird.velocity = 0;
    }

    pipes.forEach(pipe => pipe[0] -= 2);

    pipes = pipes.filter(pipe => pipe[0] + pipeWidth > 0);

    if (pipes[pipes.length - 1][0] <= canvas.width - pipeGap) {
        pipes.push([canvas.width + pipeDistance, pipeLoc()]);
    }

    pipes.forEach(pipe => {
        if (pipe[0] < bird.x - bird.radius && !pipe.passed) {
            pipe.passed = true;
            score++;
            updateScoreDisplay();
        }
    });

    checkCollision();
}

function updateScoreDisplay() {
    document.getElementById("currentScore").textContent = score;
    document.getElementById("bestScore").textContent = bestScore;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height, -(index * 3) % canvas.width, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height, -(index * 3) % canvas.width + canvas.width, 0, canvas.width, canvas.height);

    pipes.forEach(pipe => {
        ctx.drawImage(img, 432, 588 - pipe[1], pipeWidth, pipe[1], pipe[0], 0, pipeWidth, pipe[1]);
        ctx.drawImage(img, 432 + pipeWidth, 108, pipeWidth, canvas.height - pipe[1] + pipeGap, pipe[0], pipe[1] + pipeGap, pipeWidth, canvas.height - pipe[1] + pipeGap);
    });

    ctx.drawImage(img, 432, Math.floor((index % 9) / 3) * size[1], ...size, bird.x, bird.y, ...size);

    index++;

    update();
    checkCollision();
}

function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

resetGame();
gameLoop();

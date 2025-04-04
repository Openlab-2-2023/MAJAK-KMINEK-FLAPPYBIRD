const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const img = new Image();
img.src = "https://i.ibb.co/Q9yv5Jk/flappy-bird-set.png";
const groundImg = new Image();
groundImg.src = "obrazky/base.png";
const heartImg = new Image();
heartImg.src = "obrazky/image.png";

let bird = {
    x: 183,
    y: canvas.height / 2,
    radius: 15,
    velocity: 0,
    started: false,
    lives: 3,
    invulnerable: false,
    visible: true,
    blinkInterval: null
};

const gravity = 0.5;
const jumpStrength = -8;
let pipeGap = 135;
const pipeWidth = 78;
const pipeDistance = 250;
let pipes = [];
const pipeLoc = () => (Math.random() * ((canvas.height - (pipeGap + pipeWidth)) - pipeWidth)) + pipeWidth;
let index = 0;
let score = 0;
let bestScore = localStorage.getItem("bestScore") || 0;
const groundHeight = 50;
let groundX = 0;

let difficulty = "medium";
const buttons = document.querySelectorAll("button");

buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
        difficulty = btn.textContent.toLowerCase();
        buttons.forEach(b => b.style.background = "#4CAF50");
        btn.style.background = "#ff9800";
        setDifficultyPipeGap();
        resetGame();
    });
});

const setDifficultyPipeGap = () => {
    if (difficulty === "easy") {
        pipeGap = 170;
    } else if (difficulty === "medium") {
        pipeGap = 150;
    }
};

function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.started = false;
    bird.lives = difficulty === "easy" ? 3 : 1;
    bird.invulnerable = false;
    bird.visible = true;
    if (bird.blinkInterval) clearInterval(bird.blinkInterval);
    pipes = Array(3).fill().map((_, i) => [canvas.width + (i * (pipeGap + pipeWidth + pipeDistance / 2)), pipeLoc()]);
    score = 0;
    updateScoreDisplay();
}

document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        event.preventDefault();
        if (!bird.started) bird.started = true;
        bird.velocity = jumpStrength;
    }
});

function checkCollision() {
    // Skip collision check if bird is invulnerable (except for ground)
    if (bird.invulnerable) {
        // Check only ground collision if invulnerable
        const hitGround = bird.y + bird.radius >= canvas.height - groundHeight;
        if (hitGround) {
            if (difficulty === "easy" && bird.lives > 1) {
                bird.lives--;
                bird.velocity = -Math.abs(bird.velocity) * 0.3;
                bird.y -= 10;
            } else {
                if (score > bestScore) {
                    bestScore = score;
                    localStorage.setItem("bestScore", bestScore);
                }
                resetGame();
            }
        }
        return;
    }
    
    let hitTopPipe = false;
    let hitBottomPipe = false;
    
    // Kontrola kolízií s potrubím
    pipes.forEach(pipe => {
        if (bird.x + bird.radius > pipe[0] && bird.x - bird.radius < pipe[0] + pipeWidth) {
            if (bird.y - bird.radius < pipe[1]) {
                hitTopPipe = true;
            }
            if (bird.y + bird.radius > pipe[1] + pipeGap) {
                hitBottomPipe = true;
            }
        }
    });
    
    const hitGround = bird.y + bird.radius >= canvas.height - groundHeight;
    const hitCeiling = bird.y - bird.radius <= 0;
    
    if (hitTopPipe || hitBottomPipe || hitCeiling) {
        if (difficulty === "easy" && bird.lives > 1) {
            bird.lives--;
            
            if (hitTopPipe) {
                bird.velocity = Math.abs(bird.velocity) * 0.15;
                bird.y += 8;
            } 
            else if (hitBottomPipe) {
                bird.velocity = -Math.abs(bird.velocity) * 0.3;
                bird.y -= 10;
            }
            else if (hitCeiling) {
                bird.velocity = 0.3;
            }
            
            // 2 seconds of invulnerability (only for pipes/ceiling)
            bird.invulnerable = true;
            setTimeout(() => { 
                bird.invulnerable = false; 
            }, 2000);
            
            bird.blinkInterval = setInterval(() => {
                bird.visible = !bird.visible;
            }, 100);
            setTimeout(() => {
                clearInterval(bird.blinkInterval);
                bird.visible = true;
            }, 2000);
        } else {
            if (score > bestScore) {
                bestScore = score;
                localStorage.setItem("bestScore", bestScore);
            }
            resetGame();
        }
    }
    else if (hitGround) {
        // Ground collision - no invulnerability
        if (difficulty === "easy" && bird.lives > 1) {
            bird.lives--;
            bird.velocity = -Math.abs(bird.velocity) * 0.3;
            bird.y -= 10;
        } else {
            if (score > bestScore) {
                bestScore = score;
                localStorage.setItem("bestScore", bestScore);
            }
            resetGame();
        }
    }
}

function update() {
    if (!bird.started) return;
    bird.velocity += gravity;
    bird.y += bird.velocity;

    pipes.forEach(pipe => pipe[0] -= 2);
    pipes = pipes.filter(pipe => pipe[0] + pipeWidth > 0);
    if (pipes[pipes.length - 1][0] <= canvas.width - pipeGap) pipes.push([canvas.width + pipeDistance, pipeLoc()]);

    pipes.forEach(pipe => {
        if (pipe[0] < bird.x - bird.radius && !pipe.passed) {
            pipe.passed = true;
            score++;
            updateScoreDisplay();
        }
    });

    groundX -= 2;
    if (groundX <= -canvas.width) groundX = 0;
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
    
    // Draw bird only if visible
    if (bird.visible || !bird.invulnerable) {
        ctx.drawImage(img, 432, Math.floor((index % 9) / 3) * 36, 51, 36, bird.x, bird.y, 51, 36);
    }
    
    ctx.drawImage(groundImg, groundX, canvas.height - groundHeight, canvas.width, groundHeight);
    ctx.drawImage(groundImg, groundX + canvas.width, canvas.height - groundHeight, canvas.width, groundHeight);
    
    const heartSize = 20;
    const heartSpacing = 5;
    for (let i = 0; i < bird.lives; i++) {
        ctx.drawImage(heartImg, 10 + (i * (heartSize + heartSpacing)), 10, heartSize, heartSize);
    }
    
    index++;
    update();
}

function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

resetGame();
gameLoop();
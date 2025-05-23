const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const seasonBackgrounds = {
    spring: new Image(),
    summer: new Image(),
    autumn: new Image(),
    winter: new Image()
};
seasonBackgrounds.spring.src = "obrazky/spring.png";
seasonBackgrounds.summer.src = "obrazky/summer.png";
seasonBackgrounds.autumn.src = "obrazky/autumn.png";
seasonBackgrounds.winter.src = "obrazky/winter.png";

const img = new Image();
img.src = "https://i.ibb.co/Q9yv5Jk/flappy-bird-set.png";
const groundImg = new Image();
const heartImg = new Image();
heartImg.src = "obrazky/image.png";

const gravity = 0.5;
const jumpStrength = -8;
let pipeGap = 135;
const pipeWidth = 78;
const pipeDistance = 250;
const groundHeight = 130;

let groundX = 0;

const pipeLoc = () => {
    const minPipeY = pipeWidth;
    const maxPipeY = canvas.height - groundHeight - pipeGap - pipeWidth;
    return Math.random() * (maxPipeY - minPipeY) + minPipeY;
};

let pipes = [];
let index = 0;
let score = 0;
let bestScores = { easy: 0, medium: 0, hard: 0 };
let difficulty = "medium";
const buttons = document.querySelectorAll("button");

let hearts = [];
let pipesPassed = 0;
let pipeSpeedFactor = 1;

let gameOver = false;
let newBest = false;

let bird = {
    x: 183,
    y: canvas.height / 2,
    radius: 15,
    velocity: 0,
    started: false,
    lives: 3,
    invulnerable: false,
    visible: true,
    blinkInterval: null,
    hitbox: {
        x: 183,
        y: canvas.height / 2,
        width: 40,
        height: 36
    }
};

const seasons = ["spring", "summer", "autumn", "winter"];
let currentSeasonIndex = 0;
let currentSeason = seasons[currentSeasonIndex];

// Sezónny preblik
let seasonTransitioning = false;
let seasonTransitionAlpha = 0;
let seasonTransitionTimer = 0;
const SEASON_TRANSITION_DURATION = 30;

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
    pipeGap = (difficulty === "easy") ? 170 : 150;
};

function resetGame() {
    gameOver = false;
    newBest = false;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.started = false;
    bird.lives = difficulty === "easy" ? 3 : 1;
    bird.invulnerable = false;
    bird.visible = true;
    bird.hitbox.x = 183;
    bird.hitbox.y = canvas.height / 2;
    if (bird.blinkInterval) clearInterval(bird.blinkInterval);

    pipes = Array(3).fill().map((_, i) => ({
        x: canvas.width + (i * (pipeGap + pipeWidth + pipeDistance / 2)),
        y: pipeLoc(),
        direction: Math.random() > 0.5 ? 1 : -1,
        speed: difficulty === "hard" ? 1.5 : 0
    }));

    hearts = [];
    pipesPassed = 0;
    score = 0;
    pipeSpeedFactor = 1;
    currentSeasonIndex = 0;
    currentSeason = seasons[currentSeasonIndex];

    updateScoreDisplay();
}

document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        event.preventDefault();
        if (gameOver) {
            resetGame();
            return;
        }
        if (!bird.started) bird.started = true;
        bird.velocity = jumpStrength;
    }
});

function spawnHeart() {
    if (difficulty !== "easy" || bird.lives >= 3) return;
    if (Math.random() < 0.25) {
        hearts.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - groundHeight - 60) + 30,
            width: 30,
            height: 30,
            collected: false
        });
    }
}

function checkCollision() {
    const pipeHitbox = {
        x: bird.hitbox.x - bird.radius,
        y: bird.hitbox.y - bird.radius,
        width: bird.hitbox.width + bird.radius * 2,
        height: bird.hitbox.height + bird.radius * 2
    };

    if (bird.invulnerable) {
        if (bird.y + bird.radius >= canvas.height - groundHeight) {
            if (difficulty === "easy" && bird.lives > 1) {
                bird.lives--;
                bird.velocity = -Math.abs(bird.velocity) * 0.3;
                bird.y -= 10;
            } else {
                saveBestScore();
                gameOver = true;
            }
        }
        return;
    }

    let hitTopPipe = false;
    let hitBottomPipe = false;

    pipes.forEach(pipe => {
        const pipeX = pipe.x;
        const pipeTop = pipe.y;
        const pipeBottom = pipe.y + pipeGap;

        const withinX = bird.hitbox.x + bird.hitbox.width - 5 > pipeX &&
            bird.hitbox.x < pipeX + pipeWidth;

        const hitsTop = bird.hitbox.y < pipeTop + 10;
        const hitsBottom = bird.hitbox.y + bird.hitbox.height > pipeBottom + 5;

        if (withinX && (hitsTop || hitsBottom)) {
            hitTopPipe = hitsTop;
            hitBottomPipe = hitsBottom;
        }
    });

    const hitGround = bird.y + bird.radius >= canvas.height - groundHeight;
    const hitCeiling = bird.y - bird.radius <= 0;

    if (hitTopPipe || hitBottomPipe || hitCeiling || hitGround) {
        if (difficulty === "medium") {
            saveBestScore();
            gameOver = true;
        } else if (difficulty === "easy" && bird.lives > 1) {
            bird.lives--;
            bird.velocity = -Math.abs(bird.velocity) * 0.3;
            bird.y -= 10;
            bird.invulnerable = true;
            setTimeout(() => { bird.invulnerable = false; }, 1000);

            bird.blinkInterval = setInterval(() => {
                bird.visible = !bird.visible;
            }, 100);
            setTimeout(() => {
                bird.invulnerable = false;
                clearInterval(bird.blinkInterval);
                bird.visible = true;
            }, 1000);
        } else {
            saveBestScore();
            gameOver = true;
        }
    }
}

function update() {
    if (!bird.started || gameOver) return;

    bird.velocity += gravity;
    bird.y += bird.velocity;
    bird.hitbox.x = bird.x;
    bird.hitbox.y = bird.y;

    pipes.forEach(pipe => {
        pipe.x -= 2 * pipeSpeedFactor;
        if (difficulty === "hard") {
            pipe.y += pipe.direction * pipe.speed * pipeSpeedFactor;
            if (pipe.y <= pipeWidth || pipe.y >= canvas.height - groundHeight - pipeGap - pipeWidth) {
                pipe.direction *= -1;
            }
        }
    });

    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);
    if (pipes[pipes.length - 1].x <= canvas.width - pipeGap) {
        pipes.push({
            x: canvas.width + pipeDistance,
            y: pipeLoc(),
            direction: Math.random() > 0.5 ? 1 : -1,
            speed: difficulty === "hard" ? 1.5 : 0
        });
    }

    if (difficulty === "hard") {
        pipeSpeedFactor = 1 + (pipesPassed / 20);
    }

    pipes.forEach(pipe => {
        if (pipe.x + pipeWidth < bird.x && !pipe.passed) {
            pipe.passed = true;
            score++;
            pipesPassed++;
            updateScoreDisplay();
            spawnHeart();

            if (pipesPassed % 5 === 0 && !seasonTransitioning) {
                seasonTransitioning = true;
                seasonTransitionAlpha = 0;
                seasonTransitionTimer = 0;
                setTimeout(() => {
                    currentSeasonIndex = (currentSeasonIndex + 1) % seasons.length;
                    currentSeason = seasons[currentSeasonIndex];
                }, 250);
                setTimeout(() => {
                    seasonTransitioning = false;
                }, 500);
            }
        }
    });

    hearts.forEach(heart => {
        heart.x -= 2;
        if (!heart.collected &&
            bird.x < heart.x + heart.width &&
            bird.x + bird.hitbox.width > heart.x &&
            bird.y < heart.y + heart.height &&
            bird.y + bird.hitbox.height > heart.y
        ) {
            heart.collected = true;
            if (bird.lives < 3) bird.lives++;
        }
    });

    hearts = hearts.filter(heart => heart.x + heart.width > 0 && !heart.collected);

    groundX -= 2;
    if (groundX <= -canvas.width) groundX = 0;

    if (!seasonTransitioning) {
        checkCollision();
    }
}

function saveBestScore() {
    if (score > bestScores[difficulty]) {
        bestScores[difficulty] = score;
        localStorage.setItem("bestScores", JSON.stringify(bestScores));
        newBest = true;
    } else {
        newBest = false;
    }
}

function loadBestScore() {
    const storedScores = JSON.parse(localStorage.getItem("bestScores"));
    if (storedScores) {
        bestScores = storedScores;
    }
    updateScoreDisplay();
}

function updateScoreDisplay() {
    document.getElementById("currentScore").textContent = score;
    document.getElementById("bestScore").textContent = bestScores[difficulty];
}

let backgroundX = 0;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const backgroundImg = seasonBackgrounds[currentSeason];
    backgroundX -= 1;
    if (backgroundX <= -canvas.width) backgroundX = 0;
    ctx.drawImage(backgroundImg, backgroundX, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImg, backgroundX + canvas.width, 0, canvas.width, canvas.height);

    if (!seasonTransitioning) {
        pipes.forEach(pipe => {
            ctx.drawImage(img, 432, 588 - pipe.y, pipeWidth, pipe.y, pipe.x, 0, pipeWidth, pipe.y);
            ctx.drawImage(img, 432 + pipeWidth, 108, pipeWidth, canvas.height - groundHeight - pipe.y - pipeGap, pipe.x, pipe.y + pipeGap, pipeWidth, canvas.height - 118 - pipe.y - pipeGap);
        });
    }

    if (bird.visible || !bird.invulnerable) {
        ctx.drawImage(img, 432, Math.floor((index % 9) / 3) * 36, 51, 36, bird.x, bird.y, 51, 36);
    }

    hearts.forEach(heart => {
        ctx.drawImage(heartImg, heart.x, heart.y, heart.width, heart.height);
    });

    ctx.drawImage(groundImg, groundX, canvas.height - groundHeight, canvas.width, groundHeight);
    ctx.drawImage(groundImg, groundX + canvas.width, canvas.height - groundHeight, canvas.width, groundHeight);

    const heartSize = 20;
    const heartSpacing = 5;
    for (let i = 0; i < bird.lives; i++) {
        ctx.drawImage(heartImg, 10 + (i * (heartSize + heartSpacing)), 10, heartSize, heartSize);
    }

    if (!bird.started && !gameOver) {
        ctx.font = "bold 28px Arial";
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + 0.5 * Math.sin(Date.now() / 400)})`;
        ctx.textAlign = "center";
        ctx.fillText("TAP SPACE TO START", canvas.width / 2, canvas.height / 2 - 50);
    }

    if (gameOver) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "bold 36px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = "24px Arial";
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText(`Best: ${bestScores[difficulty]}`, canvas.width / 2, canvas.height / 2 + 40);
        if (newBest) {
            ctx.fillStyle = "#FFD700";
            ctx.font = "bold 22px Arial";
            ctx.fillText("NEW BEST SCORE! 🎉", canvas.width / 2, canvas.height / 2 + 80);
        }
        ctx.restore();
        return;
    }

    // Biely preblik pri zmene sezóny
    if (seasonTransitioning) {
        seasonTransitionTimer++;
        seasonTransitionAlpha = Math.sin((seasonTransitionTimer / SEASON_TRANSITION_DURATION) * Math.PI);
        ctx.fillStyle = `rgba(255, 255, 255, ${seasonTransitionAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    index++;
    update();
}

function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

function resetBestScoresOnPageLoad() {
    bestScores = { easy: 0, medium: 0, hard: 0 };
    localStorage.removeItem("bestScores");
    updateScoreDisplay();
}

resetBestScoresOnPageLoad();
loadBestScore();
resetGame();
gameLoop();

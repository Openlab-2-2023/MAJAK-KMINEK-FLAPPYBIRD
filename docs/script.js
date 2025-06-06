const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let bestScores = { easy: 0, medium: 0, hard: 0 }; 
let sessionBestScores = { easy: 0, medium: 0, hard: 0 };

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
heartImg.src = "obrazky/heart.png";

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


window.addEventListener("beforeunload", () => {
    sessionBestScores = { easy: 0, medium: 0, hard: 0 };
});

let menuSelectionIndex = 1;

document.addEventListener("keydown", (event) => {
    if (!bird.started || gameOver) {
        if (event.code === "ArrowUp") {
            event.preventDefault();
            menuSelectionIndex = (menuSelectionIndex - 1 + 3) % 3;
            difficulty = ["easy", "medium", "hard"][menuSelectionIndex];
            updateScoreDisplay();
        } else if (event.code === "ArrowDown") {
            event.preventDefault();
            menuSelectionIndex = (menuSelectionIndex + 1) % 3;
            difficulty = ["easy", "medium", "hard"][menuSelectionIndex];
            updateScoreDisplay();
        } else if (event.code === "Space") {
            event.preventDefault();
            if (!bird.started) {
                difficulty = ["easy", "medium", "hard"][menuSelectionIndex];
                setDifficultyPipeGap();
                resetGame();
                bird.started = true;
            }
            bird.velocity = jumpStrength;
        }
    } else if (event.code === "Space" && !gameOver) {
        event.preventDefault();
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

    if (bird.y + bird.radius >= canvas.height - groundHeight) {
        saveBestScore();
        gameOver = true;
        bird.started = false;
        return;
    }

    let hitTopPipe = false;
    let hitBottomPipe = false;

    pipes.forEach(pipe => {
        const pipeX = pipe.x;
        const pipeTop = pipe.y;
        const pipeBottom = pipe.y + pipeGap;

        const withinX = bird.hitbox.x + bird.hitbox.width - 10 > pipeX &&
            bird.hitbox.x < pipeX + pipeWidth;

        const hitsTop = bird.hitbox.y < pipeTop + 5;
        const hitsBottom = bird.hitbox.y + bird.hitbox.height > pipeBottom + 5;

        if (withinX && (hitsTop || hitsBottom)) {
            hitTopPipe = hitsTop;
            hitBottomPipe = hitsBottom;
        }
    });

    const hitGround = bird.y + bird.radius >= canvas.height - groundHeight;

    if (!bird.invulnerable && (hitTopPipe || hitBottomPipe || hitGround)) {
        if (difficulty === "medium" || difficulty === "hard" || (difficulty === "easy" && bird.lives <= 1)) {
            saveBestScore();
            gameOver = true;
            bird.started = false;
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
            bird.started = false;
        }
    }
}

function update() {
    if (!bird.started || gameOver) return;

    bird.velocity += gravity;
    bird.y += bird.velocity;
    bird.hitbox.x = bird.x;
    bird.hitbox.y = bird.y;

    if (!gameOver) {
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
                sessionBestScores[difficulty] = Math.max(sessionBestScores[difficulty], score);
                updateScoreDisplay();
                spawnHeart();

                if (pipesPassed % 3 === 0 && !seasonTransitioning) {
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
    }

    groundX -= 2;
    if (groundX <= -canvas.width) groundX = 0;

    if (!seasonTransitioning) {
        checkCollision();
    }
}

function saveBestScore() {
    sessionBestScores[difficulty] = Math.max(sessionBestScores[difficulty], score);

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
    
    const displayScore = bird.started ? sessionBestScores[difficulty] : bestScores[difficulty];
    document.getElementById("currentScore").textContent = score;
    document.getElementById("bestScore").textContent = displayScore;
}

let backgroundX = 0;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const backgroundImg = seasonBackgrounds[currentSeason];
    if (!gameOver) {
        backgroundX -= 1;
        if (backgroundX <= -canvas.width) backgroundX = 0;
    }

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

    if (!bird.started) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(40, 80, canvas.width - 80, 450);

        ctx.font = "bold 24px 'Press Start 2P'";
        ctx.fillStyle = "#FFF";
        ctx.textAlign = "center";
        ctx.fillText("FLAPPY BIRD", canvas.width / 2, 140);

        ctx.font = "14px 'Press Start 2P'";
        ctx.fillText(`Best: ${bestScores[difficulty]}  |  Score: ${score}`, canvas.width / 2, 190);

        ctx.fillText("SELECT DIFFICULTY", canvas.width / 2, 240);

        ["easy", "medium", "hard"].forEach((level, i) => {
            const y = 280 + i * 60;
            const isSelected = difficulty === level;
            const btnX = canvas.width / 2 - 90;
            const btnY = y - 20;
            const btnW = 180;
            const btnH = 40;

            ctx.fillStyle = isSelected ? "#FFD700" : "#4CAF50";
            ctx.strokeStyle = isSelected ? "#FFA000" : "#2E7D32";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(btnX, btnY, btnW, btnH, 10);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#FFF";
            ctx.font = "12px 'Press Start 2P'";
            ctx.fillText(level.toUpperCase(), canvas.width / 2, y + 5);
        });

        ctx.font = "12px 'Press Start 2P'";
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + 0.4 * Math.sin(Date.now() / 300)})`;
        ctx.fillText("PRESS SPACE TO START", canvas.width / 2, 480);
    }

    if (seasonTransitioning) {
        seasonTransitionTimer++;
        seasonTransitionAlpha = Math.sin((seasonTransitionTimer / SEASON_TRANSITION_DURATION) * Math.PI);
        ctx.fillStyle = `rgba(255, 255, 255, ${seasonTransitionAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (bird.started && !gameOver) {
        ctx.font = "14px 'Press Start 2P'";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "right";

        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 4;

        ctx.fillText(`Score: ${score}`, canvas.width - 20, 30);
        ctx.fillText(`Best: ${sessionBestScores[difficulty]}`, canvas.width - 20, 50);

        ctx.shadowColor = "transparent";
    }

    index++;
    update();
}

function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

loadBestScore();
resetGame();
gameLoop();
// Vytvorenie canvasu a kontextu
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Načítanie obrázkov pozadí podľa ročného obdobia
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

// Ostatné obrázky
const img = new Image();
img.src = "https://i.ibb.co/Q9yv5Jk/flappy-bird-set.png";
const groundImg = new Image();
const heartImg = new Image();
heartImg.src = "obrazky/image.png";

// Herné premenné
const gravity = 0.5;
const jumpStrength = -8;
let pipeGap = 135;
const pipeWidth = 78;
const pipeDistance = 250;

// ✅ Upravené: výška zeme
const groundHeight = 130;
let groundX = 0;

// ✅ Upravené: výpočet pozície rúrky – rešpektuje zem
const pipeLoc = () => {
    const minPipeY = pipeWidth;
    const maxPipeY = canvas.height - groundHeight - pipeGap - pipeWidth;
    return Math.random() * (maxPipeY - minPipeY) + minPipeY;
};

let pipes = [];
let index = 0;
let score = 0;
let bestScores = {
    easy: 0,
    medium: 0,
    hard: 0
};
let difficulty = "medium";
const buttons = document.querySelectorAll("button");

let hearts = [];
let pipesPassed = 0;
let pipeSpeedFactor = 1;

// Vlastnosti vtáka
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

// Sezóny
const seasons = ["spring", "summer", "autumn", "winter"];
let currentSeasonIndex = 0;
let currentSeason = seasons[currentSeasonIndex];

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
    } else {
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
        if (!bird.started) bird.started = true;
        bird.velocity = jumpStrength;
    }
});

function spawnHeart() {
    if (difficulty !== "easy" || bird.lives >= 3) return;
    const spawnChance = 0.25;
    if (Math.random() < spawnChance) {
        const heart = {
            x: canvas.width,
            y: Math.random() * (canvas.height - groundHeight - 60) + 30,
            width: 30,
            height: 30,
            collected: false
        };
        hearts.push(heart);
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
        const hitGround = bird.y + bird.radius >= canvas.height - groundHeight;
        if (hitGround) {
            if (difficulty === "easy" && bird.lives > 1) {
                bird.lives--;
                bird.velocity = -Math.abs(bird.velocity) * 0.3;
                bird.y -= 10;
            } else {
                saveBestScore();
                resetGame();
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

    if (hitTopPipe || hitBottomPipe || hitCeiling) {
        if (difficulty === "medium") {
            saveBestScore();
            resetGame();
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
            resetGame();
        }
    } else if (hitGround) {
        saveBestScore();
        resetGame();
    }
}

function update() {
    if (!bird.started) return;

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

            if (pipesPassed % 2 === 0) {
                currentSeasonIndex = (currentSeasonIndex + 1) % seasons.length;
                currentSeason = seasons[currentSeasonIndex];
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

    checkCollision();
}

function saveBestScore() {
    if (score > bestScores[difficulty]) {
        bestScores[difficulty] = score;
        localStorage.setItem("bestScores", JSON.stringify(bestScores));
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

// Pohyb pozadia
let backgroundX = 0;
let isBirdMoving = false;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bird.velocity !== 0) {
        isBirdMoving = true;
    } else {
        isBirdMoving = true;
    }

    const backgroundImg = seasonBackgrounds[currentSeason];


    // Pohyb pozadia len ak je vták v pohybe
    if (isBirdMoving) {
        backgroundX -= 1;
    }

    // Cyklický pohyb pozadia
    if (backgroundX <= -canvas.width) {
        backgroundX = 0;
    }

    // Zobrazenie pozadia
    ctx.drawImage(backgroundImg, backgroundX, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImg, backgroundX + canvas.width, 0, canvas.width, canvas.height);

    pipes.forEach(pipe => {
        ctx.drawImage(img, 432, 588 - pipe.y, pipeWidth, pipe.y, pipe.x, 0, pipeWidth, pipe.y);
        ctx.drawImage(img, 432 + pipeWidth, 108, pipeWidth, canvas.height - groundHeight - pipe.y - pipeGap, pipe.x, pipe.y + pipeGap, pipeWidth, canvas.height -118 - pipe.y - pipeGap);
    });

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
        const opacity = 0.5 + 0.5 * Math.sin(Date.now() / 300);
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("TAP SPACE TO START", canvas.width / 2, canvas.height / 2 - 50);
        ctx.restore();
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

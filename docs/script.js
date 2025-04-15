// Vytvorenie canvasu a kontextu
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Načítanie obrázkov
const img = new Image();
img.src = "https://i.ibb.co/Q9yv5Jk/flappy-bird-set.png";
const groundImg = new Image();
groundImg.src = "obrazky/base.png";
const heartImg = new Image();
heartImg.src = "obrazky/image.png";

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

// Herné premenné
const gravity = 0.5;
const jumpStrength = -8;
let pipeGap = 135;
const pipeWidth = 78;
const pipeDistance = 250;
let pipes = [];
const pipeLoc = () => (Math.random() * ((canvas.height - (pipeGap + pipeWidth)) - pipeWidth)) + pipeWidth;
let index = 0;
let score = 0;
let bestScore = 0;
const groundHeight = 50;
let groundX = 0;

// Ťažkosť a tlačidlá
let difficulty = "medium";
const buttons = document.querySelectorAll("button");

// Srdcia a počítadlo rúrok
let hearts = [];
let pipesPassed = 0;

// Nastavenie medzery podľa obtiažnosti
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

// Funkcia na resetovanie hry
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
    pipes = Array(3).fill().map((_, i) => [canvas.width + (i * (pipeGap + pipeWidth + pipeDistance / 2)), pipeLoc()]);
    hearts = []; // Vymazanie všetkých srdiečok
    pipesPassed = 0;
    score = 0;
    updateScoreDisplay();
}

// Skok cez medzerník
document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        event.preventDefault();
        if (!bird.started) bird.started = true;
        bird.velocity = jumpStrength;
    }
});

// Funkcia na vytvorenie srdiečka
function spawnHeart() {
    const heart = {
        x: canvas.width,
        y: Math.random() * (canvas.height - groundHeight - 60) + 30,
        width: 20,
        height: 20,
        collected: false
    };
    hearts.push(heart);
}

// Detekcia kolízie
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

    pipes.forEach(pipe => {
        const pipeX = pipe[0];
        const pipeTop = pipe[1];
        const pipeBottom = pipe[1] + pipeGap;

        const withinX = bird.hitbox.x + bird.hitbox.width - 5 > pipeX &&
            bird.hitbox.x < pipeX + pipeWidth;

        const hitsTop = bird.hitbox.y < pipeTop + 10;
        const hitsBottom = bird.hitbox.y + bird.hitbox.height > pipeBottom - 10;

        if (withinX && (hitsTop || hitsBottom)) {
            hitTopPipe = hitsTop;
            hitBottomPipe = hitsBottom;
        }
    });

    const hitGround = bird.y + bird.radius >= canvas.height - groundHeight;
    const hitCeiling = bird.y - bird.radius <= 0;

    // Reakcia na kolíziu
    if (hitTopPipe || hitBottomPipe || hitCeiling) {
        if (difficulty === "medium") {
            if (score > bestScore) {
                bestScore = score;
                localStorage.setItem("bestScore", bestScore);
            }
            resetGame();
        } else if (difficulty === "easy" && bird.lives > 1) {
            bird.lives--;
            bird.velocity = -Math.abs(bird.velocity) * 0.3;
            bird.y -= 10;
            bird.invulnerable = true;
            setTimeout(() => { bird.invulnerable = false; }, 1000);

            // Blikanie vtáka
            bird.blinkInterval = setInterval(() => {
                bird.visible = !bird.visible;
            }, 100);
            setTimeout(() => {
                bird.invulnerable = false;
                clearInterval(bird.blinkInterval);
                bird.visible = true;
            }, 1000);
        } else {
            if (score > bestScore) {
                bestScore = score;
                localStorage.setItem("bestScore", bestScore);
            }
            resetGame();
        }
    } else if (hitGround) {
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

// Herná logika
function update() {
    if (!bird.started) return;

    bird.velocity += gravity;
    bird.y += bird.velocity;
    bird.hitbox.x = bird.x;
    bird.hitbox.y = bird.y;

    // Pohyb rúr
    pipes.forEach(pipe => pipe[0] -= 2);
    pipes = pipes.filter(pipe => pipe[0] + pipeWidth > 0);
    if (pipes[pipes.length - 1][0] <= canvas.width - pipeGap) pipes.push([canvas.width + pipeDistance, pipeLoc()]);

    // Skóre a srdce po 3 rúrkach
    pipes.forEach(pipe => {
        if (pipe[0] + pipeWidth < bird.x && !pipe.passed) {
            pipe.passed = true;
            score++;
            pipesPassed++;
            updateScoreDisplay();

            if (pipesPassed % 3 === 0) {
                spawnHeart(); // spawn srdca
            }
        }
    });

    // Pohyb a zber srdiečok
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

    // Pohyb zeme
    groundX -= 2;
    if (groundX <= -canvas.width) groundX = 0;

    checkCollision();
}

// Aktualizácia skóre na obrazovke
function updateScoreDisplay() {
    document.getElementById("currentScore").textContent = score;
    document.getElementById("bestScore").textContent = bestScore;
}

// Vykreslenie všetkého
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pozadie
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height, -(index * 3) % canvas.width, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height, -(index * 3) % canvas.width + canvas.width, 0, canvas.width, canvas.height);

    // Rúry
    pipes.forEach(pipe => {
        ctx.drawImage(img, 432, 588 - pipe[1], pipeWidth, pipe[1], pipe[0], 0, pipeWidth, pipe[1]);
        ctx.drawImage(img, 432 + pipeWidth, 108, pipeWidth, canvas.height - pipe[1] + pipeGap, pipe[0], pipe[1] + pipeGap, pipeWidth, canvas.height - pipe[1] + pipeGap);
    });

    // Vták
    if (bird.visible || !bird.invulnerable) {
        ctx.drawImage(img, 432, Math.floor((index % 9) / 3) * 36, 51, 36, bird.x, bird.y, 51, 36);
    }

    // Srdcia
    hearts.forEach(heart => {
        ctx.drawImage(heartImg, heart.x, heart.y, heart.width, heart.height);
    });

    // Zem
    ctx.drawImage(groundImg, groundX, canvas.height - groundHeight, canvas.width, groundHeight);
    ctx.drawImage(groundImg, groundX + canvas.width, canvas.height - groundHeight, canvas.width, groundHeight);

    // Životy hore
    const heartSize = 20;
    const heartSpacing = 5;
    for (let i = 0; i < bird.lives; i++) {
        ctx.drawImage(heartImg, 10 + (i * (heartSize + heartSpacing)), 10, heartSize, heartSize);
    }

    index++;
    update();
}

// Hlavný loop
function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

// Spustenie hry
resetGame();
gameLoop();

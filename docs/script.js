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
let bestScores = {
    easy: 0,
    medium: 0,
    hard: 0
};
const groundHeight = 50;
let groundX = 0;

// Ťažkosť a tlačidlá
let difficulty = "medium";
const buttons = document.querySelectorAll("button");

// Srdcia a počítadlo rúrok
let hearts = [];
let pipesPassed = 0;

// Premenná na zrýchlenie stĺpov
let pipeSpeedFactor = 1;

// Nastavenie medzery podľa obtiažnosti
buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
        difficulty = btn.textContent.toLowerCase();
        buttons.forEach(b => b.style.background = "#4CAF50");
        btn.style.background = "#ff9800";
        setDifficultyPipeGap();
        loadBestScore();
        resetGame();
    });
});

// Nastavenie medzery podľa obtiažnosti
const setDifficultyPipeGap = () => {
    if (difficulty === "easy") {
        pipeGap = 170;
    } else if (difficulty === "medium") {
        pipeGap = 150;
    } else if (difficulty === "hard") {
        pipeGap = 190; // Menšia medzera pre vyššiu obtiažnosť
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

    pipes = Array(3).fill().map((_, i) => ({
        x: canvas.width + (i * (pipeGap + pipeWidth + pipeDistance / 2)),
        y: pipeLoc(),
        direction: Math.random() > 0.5 ? 1 : -1, // Smer pohybu hore alebo dole
        speed: difficulty === "hard" ? 1.5 : 0 // Rýchlosť pohybu pre hard mód
    }));

    hearts = [];
    pipesPassed = 0;
    score = 0;
    pipeSpeedFactor = 1; // Reset rýchlosti stĺpov
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
    // Srdcia sa nespawnujú v režimoch medium a hard
    if (difficulty === "medium" || difficulty === "hard" || bird.lives >= 3) return;

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
        const hitsBottom = bird.hitbox.y + bird.hitbox.height > pipeBottom - 10;

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

// Herná logika
function update() {
    if (!bird.started) return;

    bird.velocity += gravity;
    bird.y += bird.velocity;
    bird.hitbox.x = bird.x;
    bird.hitbox.y = bird.y;

    // Pohyb rúr
    pipes.forEach(pipe => {
        pipe.x -= 2 * pipeSpeedFactor; // Zrýchlenie pohybu

        // Pohyb hore a dole pre hard mód
        if (difficulty === "hard") {
            pipe.y += pipe.direction * pipe.speed * pipeSpeedFactor; // Zohľadnenie zrýchlenia
            if (pipe.y <= pipeWidth || pipe.y >= canvas.height - pipeGap - pipeWidth) {
                pipe.direction *= -1; // Zmena smeru pri dosiahnutí okrajov
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

    // Zvýšenie faktor rýchlosti
    if (difficulty === "hard") {
        pipeSpeedFactor = 1 + (pipesPassed / 20); // Zvyšovanie rýchlosti
    }

    // Skóre a srdce
    pipes.forEach(pipe => {
        if (pipe.x + pipeWidth < bird.x && !pipe.passed) {
            pipe.passed = true;
            score++;
            pipesPassed++;
            updateScoreDisplay();

            spawnHeart();
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

// Uloženie najlepšieho skóre
function saveBestScore() {
    if (score > bestScores[difficulty]) {
        bestScores[difficulty] = score;
        localStorage.setItem("bestScores", JSON.stringify(bestScores));
    }
}

// Načítanie najlepšieho skóre
function loadBestScore() {
    const storedScores = JSON.parse(localStorage.getItem("bestScores"));
    if (storedScores) {
        bestScores = storedScores;
    }
    updateScoreDisplay();
}

// Aktualizácia skóre na obrazovke
function updateScoreDisplay() {
    document.getElementById("currentScore").textContent = score;
    document.getElementById("bestScore").textContent = bestScores[difficulty];
}

// Vykreslenie všetkého
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height, -(index * 3) % canvas.width, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height, -(index * 3) % canvas.width + canvas.width, 0, canvas.width, canvas.height);

    pipes.forEach(pipe => {
        ctx.drawImage(img, 432, 588 - pipe.y, pipeWidth, pipe.y, pipe.x, 0, pipeWidth, pipe.y);
        ctx.drawImage(img, 432 + pipeWidth, 108, pipeWidth, canvas.height - pipe.y + pipeGap, pipe.x, pipe.y + pipeGap, pipeWidth, canvas.height - pipe.y + pipeGap);
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

    index++;
    update();
}

// Hlavný loop
function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

// Spustenie hry
loadBestScore();
resetGame();
gameLoop();
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let bird = { x: 50, y: 250, radius: 15, velocity: 0, started: false };
const gravity = 0.5;
const jumpStrength = -8;
const pipeGap = 100;
let pipe = { x: canvas.width, width: 50, height: Math.random() * (canvas.height - pipeGap) };

function resetGame() {
    bird.y = 250;
    bird.velocity = 0;
    bird.started = false;
    pipe.x = canvas.width;
    pipe.height = Math.random() * (canvas.height - pipeGap);
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
        (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipe.width && 
        (bird.y - bird.radius < pipe.height || bird.y + bird.radius > pipe.height + pipeGap))
    ) {
        console.log("Game Over");
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
    
    pipe.x -= 2;
    if (pipe.x + pipe.width < 0) {
        pipe.x = canvas.width;
        pipe.height = Math.random() * (canvas.height - pipeGap);
    }
    
    checkCollision();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "green";
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.height);
    ctx.fillRect(pipe.x, pipe.height + pipeGap, pipe.width, canvas.height - pipe.height - pipeGap);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
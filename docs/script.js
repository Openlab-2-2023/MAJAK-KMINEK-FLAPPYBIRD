const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let bird = { x: 50, y: 250, radius: 15, velocity: 0 };
const gravity = 0.5;
const jumpStrength = -8;

document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        bird.velocity = jumpStrength;
    }
});

function update() {
    bird.velocity += gravity;
    bird.y += bird.velocity;
    if (bird.y + bird.radius > canvas.height) {
        bird.y = canvas.height - bird.radius;
        bird.velocity = 0;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
    ctx.fill();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
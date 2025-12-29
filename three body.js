// Three-body simulation ported from Python
let SCREEN_SIZE = { width: window.innerWidth, height: window.innerHeight };
const GRAVITATIONAL_COEFFICIENT = 900;
const DEFAULT_NUMBER_OF_STARS = 3;
const BACKGROUND_COLOR = "#000000";
const MIN_VISIBLE_SIZE = 3;

// Get canvas and context
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// Update screen size function
function updateScreenSize() {
    SCREEN_SIZE.width = window.innerWidth;
    SCREEN_SIZE.height = window.innerHeight;
    canvas.width = SCREEN_SIZE.width;
    canvas.height = SCREEN_SIZE.height;
}

// Initialize screen size
updateScreenSize();

// Handle window resize
window.addEventListener("resize", () => {
    updateScreenSize();
});

function getShift() {
    return Math.max(SCREEN_SIZE.width, SCREEN_SIZE.height) / 20;
}

// Vector2 class for 2D vectors
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    subtract(other) {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    divide(scalar) {
        return new Vector2(this.x / scalar, this.y / scalar);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    lengthSquared() {
        return this.x * this.x + this.y * this.y;
    }

    distanceTo(other) {
        return this.subtract(other).length();
    }

    distanceSquaredTo(other) {
        return this.subtract(other).lengthSquared();
    }

    normalize() {
        const len = this.length();
        if (len === 0) return new Vector2(0, 0);
        return this.divide(len);
    }

    normalizeIP() {
        const len = this.length();
        if (len === 0) {
            this.x = 0;
            this.y = 0;
            return;
        }
        this.x /= len;
        this.y /= len;
    }

    scaleToLength(length) {
        const len = this.length();
        if (len === 0) return;
        const factor = length / len;
        this.x *= factor;
        this.y *= factor;
    }

    update(x, y) {
        this.x = x;
        this.y = y;
    }
}

function randomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
}

function randomPosition() {
    const xMargin = Math.ceil(SCREEN_SIZE.width / 10);
    const x =
        Math.floor(Math.random() * (SCREEN_SIZE.width - 2 * xMargin)) + xMargin;
    const yMargin = Math.ceil(SCREEN_SIZE.height / 10);
    const y =
        Math.floor(Math.random() * (SCREEN_SIZE.height - 2 * yMargin)) +
        yMargin;
    return new Vector2(x, y);
}

function randomMass(numberOfStars) {
    const mass = Math.floor(Math.random() * (4000 - 1000 + 1)) + 1000;
    const normalizedMass = (mass * 4) / numberOfStars;
    return normalizedMass;
}

function sizeFromMass(mass) {
    return mass / 50;
}

class State {
    constructor(numberOfStars) {
        this.numberOfStars = numberOfStars;

        // Sort masses by descending order so biggest stars are drawn first
        this.masses = Array.from({ length: numberOfStars }, () =>
            randomMass(numberOfStars)
        ).sort((a, b) => b - a);

        this.sizes = this.masses.map((mass) => sizeFromMass(mass));
        this.positions = Array.from({ length: numberOfStars }, () =>
            randomPosition()
        );
        this.velocities = Array.from(
            { length: numberOfStars },
            () => new Vector2(0, 0)
        );
        this.colors = Array.from({ length: numberOfStars }, () =>
            randomColor()
        );

        // Gravitation factor matrix
        this.gravitationFactor = Array.from({ length: numberOfStars }, () =>
            new Array(numberOfStars).fill(0)
        );

        this.accelerations = Array.from(
            { length: numberOfStars },
            () => new Vector2(0, 0)
        );
        const minDistance = Math.max(10, Math.max(...this.sizes));
        this.minDistanceSquared = minDistance * minDistance;

        this._updateGravitationFactor();
        this._updateAcceleration();
    }

    _updateGravitationFactor() {
        for (let i = 0; i < this.numberOfStars; i++) {
            for (let j = i + 1; j < this.numberOfStars; j++) {
                const distanceSquared = this.positions[i].distanceSquaredTo(
                    this.positions[j]
                );
                this.gravitationFactor[i][j] =
                    GRAVITATIONAL_COEFFICIENT /
                    Math.max(distanceSquared, this.minDistanceSquared);
            }
        }
    }

    _updateAcceleration() {
        for (let i = 0; i < this.numberOfStars; i++) {
            this.accelerations[i].update(0, 0);
            for (let j = 0; j < this.numberOfStars; j++) {
                if (i === j) continue;

                // Compute the unit direction vector from i to j
                const vector = this.positions[j].subtract(this.positions[i]);
                const distance = vector.length();
                if (distance <= 1) continue;

                vector.normalizeIP();
                const minIdx = Math.min(i, j);
                const maxIdx = Math.max(i, j);
                vector.scaleToLength(
                    this.masses[j] * this.gravitationFactor[minIdx][maxIdx]
                );
                this.accelerations[i].x += vector.x;
                this.accelerations[i].y += vector.y;
            }
        }
    }

    _updateVelocities(dtInS) {
        for (let i = 0; i < this.numberOfStars; i++) {
            this.velocities[i].x += this.accelerations[i].x * dtInS;
            this.velocities[i].y += this.accelerations[i].y * dtInS;
        }
    }

    _updatePositions(dtInS) {
        for (let i = 0; i < this.numberOfStars; i++) {
            this.positions[i].x += this.velocities[i].x * dtInS;
            this.positions[i].y += this.velocities[i].y * dtInS;
        }
    }

    update(dtInS) {
        this._updateVelocities(dtInS);
        this._updatePositions(dtInS);
        this._updateGravitationFactor();
        this._updateAcceleration();
    }
}

function isStarOutOfScreen(x, y, radius) {
    return (
        x + radius < 0 ||
        x - radius > SCREEN_SIZE.width ||
        y + radius < 0 ||
        y - radius > SCREEN_SIZE.height
    );
}

function drawCircleAA(color, position, radius) {
    const x = Math.round(position.x);
    const y = Math.round(position.y);
    const intRadius = Math.round(radius);

    if (isStarOutOfScreen(x, y, intRadius)) return;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, intRadius, 0, Math.PI * 2);
    ctx.fill();
}

function drawCircleNoAA(color, position, radius) {
    const x = Math.round(position.x);
    const y = Math.round(position.y);
    const intRadius = Math.round(radius);

    if (isStarOutOfScreen(x, y, intRadius)) return;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, intRadius, 0, Math.PI * 2);
    ctx.fill();
}

function scale(position, scaleFactor, xShift, yShift) {
    const screenCenter = new Vector2(
        SCREEN_SIZE.width / 2,
        SCREEN_SIZE.height / 2
    );
    const positionFromCenter = position
        .add(new Vector2(xShift, yShift))
        .subtract(screenCenter);
    const scaledPosition = positionFromCenter.multiply(scaleFactor);
    return scaledPosition.add(screenCenter);
}

function drawBodiesAA(state, scaleFactor, xShift, yShift) {
    for (let i = 0; i < state.numberOfStars; i++) {
        drawCircleAA(
            state.colors[i],
            scale(state.positions[i], scaleFactor, xShift, yShift),
            Math.max(state.sizes[i] * scaleFactor, MIN_VISIBLE_SIZE)
        );
    }
}

function drawBodiesNoAA(state, scaleFactor, xShift, yShift) {
    for (let i = 0; i < state.numberOfStars; i++) {
        drawCircleNoAA(
            state.colors[i],
            scale(state.positions[i], scaleFactor, xShift, yShift),
            Math.max(state.sizes[i] * scaleFactor, MIN_VISIBLE_SIZE)
        );
    }
}

let currentSimulation = null;

function resetSimulation(numberOfStars) {
    if (currentSimulation) {
        currentSimulation.running = false;
    }
    currentSimulation = runSimulation(numberOfStars);
}

function runSimulation(numberOfStars = DEFAULT_NUMBER_OF_STARS) {
    let running = true;
    let dtInS = 0;
    let paused = false;
    let scaleFactor = 1;
    let xShift = 0;
    let yShift = 0;

    let state = new State(numberOfStars);
    let drawBodies = state.numberOfStars > 100 ? drawBodiesNoAA : drawBodiesAA;

    let lastTime = performance.now();

    function gameLoop(currentTime) {
        if (!running) return;

        dtInS = (currentTime - lastTime) / 1000; // Convert to seconds
        lastTime = currentTime;
        dtInS = Math.min(dtInS, 0.1); // Cap at 100ms to prevent large jumps

        if (!paused) {
            state.update(dtInS);

            // Clear screen
            ctx.fillStyle = BACKGROUND_COLOR;
            ctx.fillRect(0, 0, SCREEN_SIZE.width, SCREEN_SIZE.height);

            // Draw bodies
            drawBodies(state, scaleFactor, xShift, yShift);
        }

        requestAnimationFrame(gameLoop);
    }

    // Keyboard event handlers
    const keyHandler = (event) => {
        // The "R" key resets the simulation
        if (event.key === "r" || event.key === "R") {
            state = new State(numberOfStars);
            paused = false;
            scaleFactor = 1;
            xShift = 0;
            yShift = 0;
            drawBodies =
                state.numberOfStars > 100 ? drawBodiesNoAA : drawBodiesAA;
        }
        // The "P" key pauses the simulation
        if (event.key === "p" || event.key === "P") {
            paused = !paused;
        }
        // The "a" key decreases the scale
        if (event.key === "a" || event.key === "A") {
            scaleFactor *= 0.9;
        }
        // The "z" key increases the scale
        if (event.key === "z" || event.key === "Z") {
            scaleFactor /= 0.9;
        }
        // The arrow keys move the view
        if (event.key === "ArrowLeft") {
            xShift += getShift() / scaleFactor;
        }
        if (event.key === "ArrowRight") {
            xShift -= getShift() / scaleFactor;
        }
        if (event.key === "ArrowUp") {
            yShift += getShift() / scaleFactor;
        }
        if (event.key === "ArrowDown") {
            yShift -= getShift() / scaleFactor;
        }
    };

    document.addEventListener("keydown", keyHandler);

    // Start the game loop
    requestAnimationFrame(gameLoop);

    // Return object with running flag and cleanup function
    return {
        running: true,
        cleanup: () => {
            running = false;
            document.removeEventListener("keydown", keyHandler);
        },
    };
}

// Setup UI controls
const numStarsInput = document.getElementById("numStars");
const restartBtn = document.getElementById("restartBtn");

restartBtn.addEventListener("click", () => {
    const numStars = parseInt(numStarsInput.value) || DEFAULT_NUMBER_OF_STARS;
    if (currentSimulation) {
        currentSimulation.cleanup();
    }
    resetSimulation(Math.max(1, Math.min(1000, numStars)));
});

// Start the simulation when the script loads
resetSimulation(DEFAULT_NUMBER_OF_STARS);

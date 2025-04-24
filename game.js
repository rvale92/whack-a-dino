const holes = document.querySelectorAll('.hole');
const dinos = document.querySelectorAll('.dino');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const roundDisplay = document.getElementById('round');
const startButton = document.getElementById('startButton');
const roarSound = document.getElementById('roarSound');
const cheersSound = document.getElementById('cheersSound');
const gameContainer = document.querySelector('.game-container');
const celebrationOverlay = document.querySelector('.celebration-overlay');

let score = 0;
let timeLeft = 45;
let gameRunning = false;
let lastHole;
let timer;
let currentRound = 1;
let peepInterval;
const TOTAL_ROUNDS = 25;
let dinosAppeared = 0; // Track total dinos that appeared
let successRate = 0; // Track success rate

// Difficulty settings
const difficultySettings = {
    baseSpeed: 6000, // Start with 6 seconds between appearances
    speedDecrease: 200, // Decrease time between appearances by 200ms each round
    minSpeed: 1000, // Minimum time between appearances
    baseDuration: 2000, // How long dino stays up
    durationDecrease: 50, // Decrease duration by 50ms each round
    minDuration: 500, // Minimum duration dino stays up
    requiredSuccessRate: 0.6 // 60% success rate required
};

// Round images array
const roundImages = [
    'assets/Round Images/dinosaur-46271_640.png',
    'assets/Round Images/cartoon-1295929_640.png',
    'assets/Round Images/dinosaur-46275_1280.png',
    'assets/Round Images/ai-generated-8827035_640.png',
    'assets/Round Images/red-44844_1280.png',
    'assets/Round Images/ai-generated-8675001_640.png',
    'assets/Round Images/back-44831_640.png',
    'assets/Round Images/blue-44845_640.png',
    'assets/Round Images/dinosaur-45639_640.png',
    'assets/Round Images/dinosaur-7761348_640.png',
    'assets/Round Images/dinosaur-307869_640.png',
    'assets/Round Images/dinosaur-9552190_640.png',
    'assets/Round Images/Dino.png',
    'assets/Round Images/dinosaur-oil-painting-8336922_640.png'
];

function getRandomTime(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function getRandomHole(holes) {
    const index = Math.floor(Math.random() * holes.length);
    const hole = holes[index];
    
    if (hole === lastHole) {
        return getRandomHole(holes);
    }
    
    lastHole = hole;
    return hole;
}

function getCurrentSpeed() {
    const speed = difficultySettings.baseSpeed - (currentRound - 1) * difficultySettings.speedDecrease;
    return Math.max(speed, difficultySettings.minSpeed);
}

function getCurrentDuration() {
    const duration = difficultySettings.baseDuration - (currentRound - 1) * difficultySettings.durationDecrease;
    return Math.max(duration, difficultySettings.minDuration);
}

function updateSuccessRate() {
    successRate = dinosAppeared > 0 ? score / dinosAppeared : 0;
    return successRate >= difficultySettings.requiredSuccessRate;
}

function peep() {
    if (!gameRunning) return;

    const time = getCurrentSpeed();
    const duration = getCurrentDuration();
    const hole = getRandomHole(holes);
    const dino = hole.querySelector('.dino');
    
    dino.classList.add('up');
    dinosAppeared++;
    
    setTimeout(() => {
        dino.classList.remove('up');
        if (gameRunning) {
            peepInterval = setTimeout(peep, time);
        }
    }, duration);
}

function bonk(e) {
    if (!e.isTrusted || !gameRunning) return;
    
    score++;
    this.parentNode.classList.remove('up');
    this.classList.add('bonked');
    
    roarSound.currentTime = 0;
    roarSound.play();
    
    setTimeout(() => this.classList.remove('bonked'), 300);
    scoreDisplay.textContent = score;
}

function updateTimer() {
    timerDisplay.textContent = timeLeft;
    if (timeLeft === 0) {
        if (currentRound < TOTAL_ROUNDS && updateSuccessRate()) {
            startNextRound();
        } else {
            endGame();
        }
        return;
    }
    timeLeft--;
}

function createConfetti() {
    const colors = ['#FF6B6B', '#4A90E2', '#4CAF50', '#FFC107', '#9C27B0', '#FF1744', '#00E676', '#2979FF', '#FFD600'];
    celebrationOverlay.innerHTML = '';
    
    // Create confetti in batches for better performance
    const createBatch = (startIndex) => {
        const batchSize = 50;
        const endIndex = Math.min(startIndex + batchSize, 150);
        
        for (let i = startIndex; i < endIndex; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDelay = (Math.random() * 2) + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
            
            // Random rotation and scale
            const rotation = Math.random() * 360;
            const scale = Math.random() * 0.5 + 0.5;
            confetti.style.transform = `rotate(${rotation}deg) scale(${scale})`;
            
            celebrationOverlay.appendChild(confetti);
        }
        
        if (endIndex < 150) {
            setTimeout(() => createBatch(endIndex), 100);
        }
    };
    
    createBatch(0);
}

function celebrateRoundComplete() {
    // Clear any existing celebration
    gameContainer.classList.remove('celebrating');
    celebrationOverlay.classList.remove('show');
    celebrationOverlay.innerHTML = '';
    
    // Force a reflow to ensure animations trigger
    void gameContainer.offsetWidth;
    void celebrationOverlay.offsetWidth;
    
    // Start new celebration
    requestAnimationFrame(() => {
        gameContainer.classList.add('celebrating');
        celebrationOverlay.classList.add('show');
        createConfetti();
        
        // Play celebration sounds
        cheersSound.currentTime = 0;
        cheersSound.play();
    });
}

function updateDinoImage() {
    const imageIndex = (currentRound - 1) % roundImages.length;
    dinos.forEach(dino => {
        dino.style.backgroundImage = `url('${roundImages[imageIndex]}')`;
    });
}

function startNextRound() {
    // Celebrate round completion first
    celebrateRoundComplete();
    
    // Update round info after a short delay
    setTimeout(() => {
        currentRound++;
        roundDisplay.textContent = currentRound;
        timeLeft = 45;
        score = 0;
        dinosAppeared = 0;
        scoreDisplay.textContent = '0';
        
        // Update dinosaur image for the new round
        updateDinoImage();
        
        // Clear any existing game intervals
        clearTimeout(peepInterval);
        
        // Start the new round after celebration
        setTimeout(() => {
            gameContainer.classList.remove('celebrating');
            celebrationOverlay.classList.remove('show');
            celebrationOverlay.innerHTML = '';
            cheersSound.pause();
            cheersSound.currentTime = 0;
            peep();
        }, 5000);
    }, 500);
}

function updateStartButton() {
    if (gameRunning) {
        startButton.textContent = 'Stop Game';
        startButton.style.backgroundColor = '#ff4444';
    } else {
        startButton.textContent = 'Start Game!';
        startButton.style.backgroundColor = '#4CAF50';
    }
}

function startGame() {
    if (gameRunning) {
        endGame();
        return;
    }
    
    score = 0;
    dinosAppeared = 0;
    timeLeft = 45;
    currentRound = 1;
    gameRunning = true;
    scoreDisplay.textContent = '0';
    timerDisplay.textContent = timeLeft;
    roundDisplay.textContent = currentRound;
    
    // Clear any existing celebrations
    gameContainer.classList.remove('celebrating');
    celebrationOverlay.classList.remove('show');
    celebrationOverlay.innerHTML = '';
    
    updateStartButton();
    
    // Set initial dinosaur image
    updateDinoImage();
    
    timer = setInterval(updateTimer, 1000);
    peep();
}

function endGame() {
    gameRunning = false;
    clearInterval(timer);
    clearTimeout(peepInterval);
    
    // Clear any existing celebrations
    gameContainer.classList.remove('celebrating');
    celebrationOverlay.classList.remove('show');
    celebrationOverlay.innerHTML = '';
    
    dinos.forEach(dino => {
        dino.classList.remove('up');
        dino.classList.remove('bonked');
    });
    
    const finalSuccessRate = Math.round(successRate * 100);
    const gameOverMessage = currentRound === TOTAL_ROUNDS 
        ? `Congratulations! You completed all ${TOTAL_ROUNDS} rounds!\nFinal Score: ${score}\nSuccess Rate: ${finalSuccessRate}%`
        : `Game Over at Round ${currentRound}!\nFinal Score: ${score}\nSuccess Rate: ${finalSuccessRate}%\nYou need 60% success rate to advance!`;
    
    alert(gameOverMessage);
    currentRound = 1;
    roundDisplay.textContent = currentRound;
    updateStartButton();
}

// Make sure event listeners are attached
document.addEventListener('DOMContentLoaded', () => {
    dinos.forEach(dino => dino.addEventListener('click', bonk));
    startButton.addEventListener('click', startGame);
    
    // Set initial dinosaur image
    updateDinoImage();
}); 
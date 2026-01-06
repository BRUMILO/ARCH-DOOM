import * as THREE from 'three';
import { Engine } from './engine.js';
import { Player } from './player.js';
import { Level } from './level.js';
import { QuizManager } from './quiz.js';
import { Minimap } from './minimap.js';

const engine = new Engine();
const player = new Player(engine.camera, engine.renderer.domElement);
const level = new Level(engine.scene);
const minimap = new Minimap('minimap');

const quizManager = new QuizManager(player.controls, () => {
    // On Level Complete
    console.log("Level Complete!");
    const nextLevel = level.currentLevelIndex + 1;
    if (nextLevel <= 3) {
        alert("LEVEL " + level.currentLevelIndex + " COMPLETE! LOADING LEVEL " + nextLevel);
        level.loadLevel(nextLevel);
        document.getElementById('level-indicator').textContent = "LEVEL " + nextLevel;
        // Reset player pose if needed
        engine.camera.position.set(0, 1.6, 0);
    } else {
        alert("CONGRATULATIONS! YOU HAVE COMPLETED THE ENTERPRISE ARCHITECTURE CHALLENGE!");
        location.reload();
    }
});

const clock = new THREE.Clock();

// Game State
let currentState = 'playing';

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (player.controls.isLocked) {
        player.update(delta, level.walls);
        level.update(delta);

        // Check triggers
        level.questions.forEach(trigger => {
            if (trigger.userData.active) {
                const dist = player.camera.position.distanceTo(trigger.position);
                if (dist < 3.0) { // Distance to interact
                    quizManager.triggerQuiz(trigger, level.currentLevelIndex);
                }
            }
        });

        engine.render();

        // Update minimap
        minimap.update(player.camera.position, player.camera.rotation, level);
    }
}

animate();

// Initial spawn position
engine.camera.position.set(0, 1.6, 0);

// Pause Menu Functionality
const pauseMenu = document.getElementById('pause-menu');
const resumeBtn = document.getElementById('resume-btn');
const menuBtn = document.getElementById('menu-btn');
const sensitivitySlider = document.getElementById('sensitivity-slider');
const sensitivityValue = document.getElementById('sensitivity-value');
const quizOverlay = document.getElementById('quiz-overlay'); // To check if quiz is active

let isPaused = false;

// Convert sensitivity to slider value (0.001-0.02 range to 1-100)
// New range: 0.001 (min) to 0.5 (max) - Ultra High Sensitivity
const minSens = 0.001;
const maxSens = 0.5;
const rangeSens = maxSens - minSens;

const sensitivityToSlider = (sens) => Math.round(((sens - minSens) / rangeSens) * 99) + 1;
const sliderToSensitivity = (val) => minSens + ((val - 1) / 99) * rangeSens;

// Initialize slider with current sensitivity
const currentSens = parseFloat(localStorage.getItem('mouseSensitivity')) || 0.002;
const initialSliderValue = sensitivityToSlider(currentSens);
sensitivitySlider.value = initialSliderValue;
sensitivityValue.textContent = initialSliderValue;

// Show pause menu
function showPauseMenu() {
    isPaused = true;
    pauseMenu.style.display = 'flex';
}

// Hide pause menu and resume game
function hidePauseMenu() {
    isPaused = false;
    pauseMenu.style.display = 'none';
    player.controls.lock(); // Re-lock pointer controls
}

// DETECT POINTER UNLOCK (Pressed ESC or lost focus)
player.controls.addEventListener('unlock', () => {
    // Only show pause menu if the quiz is NOT active
    // If quiz is active, the cursor is unlocked intentionally for the quiz
    if (quizOverlay.style.display !== 'flex') {
        showPauseMenu();
    }
});

// DETECT POINTER LOCK (Resumed game)
player.controls.addEventListener('lock', () => {
    isPaused = false;
    pauseMenu.style.display = 'none';
});

// Handle ESC key - only needed to close menu if already open
// The 'unlock' event handles opening the menu naturally
document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
        if (isPaused) {
            hidePauseMenu();
        }
    }
});

// Resume button
resumeBtn.addEventListener('click', () => {
    hidePauseMenu();
});

// Return to menu button
menuBtn.addEventListener('click', () => {
    location.reload(); // Reload page to go back to start screen
});

// Update sensitivity
sensitivitySlider.addEventListener('input', (e) => {
    const sliderVal = parseInt(e.target.value);
    const newSensitivity = sliderToSensitivity(sliderVal);

    sensitivityValue.textContent = sliderVal;
    player.setMouseSensitivity(newSensitivity);
});


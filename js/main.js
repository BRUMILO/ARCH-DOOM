import * as THREE from 'three';
import { Engine } from './engine.js';
import { Player } from './player.js';
import { Level } from './level.js';
import { QuizManager } from './quiz.js';
import { Minimap } from './minimap.js';
import { Enemy } from './enemy.js';
import { Weapon } from './weapon.js';

const engine = new Engine();
const player = new Player(engine.camera, engine.renderer.domElement);
const level = new Level(engine.scene);
const minimap = new Minimap('minimap');
const weapon = new Weapon(engine.scene);
const enemies = [];

const quizManager = new QuizManager(player.controls, player, () => {
    // On Level Complete
    console.log("Level Complete!");
    const nextLevel = level.currentLevelIndex + 1;
    if (nextLevel <= 3) {
        // Show level complete modal
        showLevelCompleteModal(level.currentLevelIndex, nextLevel);
    } else {
        // Show victory modal
        showVictoryModal();
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

        // Update enemies AI and check collisions
        enemies.forEach((enemy) => {
            enemy.update(delta, player.camera.position);

            // Check if enemy attacks player
            const dist = enemy.mesh.position.distanceTo(player.camera.position);
            if (!enemy.isDead() && dist < enemy.attackRange && enemy.canAttack()) {
                player.takeDamage(enemy.getAttackDamage());
                enemy.resetAttackCooldown();
            }
        });

        engine.render();

        // Update minimap
        minimap.update(player.camera.position, player.camera.rotation, level, enemies);
    }
}

// Spawn enemies function
function spawnEnemies(count) {
    // Remove old enemies
    enemies.forEach(e => engine.scene.remove(e.mesh));
    enemies.length = 0;

    // Spawn new ones
    for (let i = 0; i < count; i++) {
        const enemy = new Enemy(engine.scene, level);
        enemies.push(enemy);
    }
}

// Shooting mechanic - click to shoot
document.addEventListener('click', () => {
    if (player.controls.isLocked && weapon.canShoot()) {
        const hit = weapon.shoot(engine.camera, enemies);

        if (hit && hit.enemy.isDead()) {
            // Remove dead enemy after a short delay
            setTimeout(() => {
                engine.scene.remove(hit.enemy.mesh);
                const index = enemies.indexOf(hit.enemy);
                if (index > -1) enemies.splice(index, 1);
            }, 500);
        }
    }
});

// Initial spawn
spawnEnemies(3);

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
    // Only show pause menu if no other overlay is active
    const quizActive = quizOverlay.style.display === 'flex';
    const gameOverActive = document.getElementById('game-over-modal').classList.contains('show');
    const levelCompleteActive = document.getElementById('level-complete-modal').classList.contains('show');
    const victoryActive = document.getElementById('victory-modal').classList.contains('show');

    if (!quizActive && !gameOverActive && !levelCompleteActive && !victoryActive) {
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

// Modal functions
function showLevelCompleteModal(currentLevel, nextLevel) {
    const modal = document.getElementById('level-complete-modal');
    const message = document.getElementById('level-complete-message');
    const stats = document.getElementById('level-stats');

    message.textContent = `SECTOR ${currentLevel} SECURED`;
    stats.textContent = `LOADING SECTOR ${nextLevel}...`;

    player.controls.unlock(); // Unlock cursor immediately
    modal.classList.add('show');

    // Setup next level button
    const nextBtn = document.getElementById('next-level-btn');
    nextBtn.onclick = () => {
        modal.classList.remove('show');

        // Load next level
        level.loadLevel(nextLevel);
        document.getElementById('level-indicator').textContent = "LEVEL " + nextLevel;
        quizManager.resetLevel(level.questions.length);
        spawnEnemies(3 + nextLevel);
        engine.camera.position.set(0, 1.6, 0);

        // Reset player health/shield
        player.health = 100;
        player.shield = 100;
        player.updateHUD();
    };
}

function showVictoryModal() {
    const modal = document.getElementById('victory-modal');
    const stats = document.getElementById('final-stats');

    stats.innerHTML = `
        <div>ALL SECTORS CLEARED</div>
        <div style="margin-top: 10px;">ARCHITECT STATUS: ELITE</div>
    `;

    player.controls.unlock(); // Unlock cursor immediately
    modal.classList.add('show');
}

import * as THREE from 'three';
import { Engine } from './engine.js';
import { Player } from './player.js';
import { Level } from './level.js';
import { QuizManager } from './quiz.js';
import { Minimap } from './minimap.js';
import { Enemy } from './enemy.js';
import { Weapon } from './weapon.js';
import { SoundManager } from './sound_manager.js';

const engine = new Engine();
const soundManager = new SoundManager();
const player = new Player(engine.camera, engine.renderer.domElement, soundManager);
const level = new Level(engine.scene);
const minimap = new Minimap('minimap');
const weapon = new Weapon(engine.scene, engine.camera, soundManager);
const enemies = [];

const quizManager = new QuizManager(player.controls, player, soundManager, () => {
    // On Level Complete
    console.log("Level Complete!");
    soundManager.play('level_complete');
    const nextLevel = level.currentLevelIndex + 1;
    if (nextLevel <= 3) {
        showLevelCompleteModal(level.currentLevelIndex, nextLevel);
    } else {
        soundManager.play('win');
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
                if (dist < 3.0) {
                    soundManager.play('pickup');
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
        const forward = new THREE.Vector3();
        player.camera.getWorldDirection(forward);
        const playerAngle = Math.atan2(forward.x, forward.z);

        minimap.update(player.camera.position, playerAngle, level, enemies);
    }
}

// Spawn enemies function
function spawnEnemies(count) {
    enemies.forEach(e => engine.scene.remove(e.mesh));
    enemies.length = 0;

    for (let i = 0; i < count; i++) {
        const enemy = new Enemy(engine.scene, level);
        enemies.push(enemy);
    }
}

// Global Kill Count
let killCount = 0;

function updateKillHUD() {
    const el = document.getElementById('kill-count');
    if (el) el.textContent = killCount;
}

// Shooting mechanic - click to shoot
document.addEventListener('click', () => {
    // Resume audio context if needed
    if (soundManager.ctx.state === 'suspended') {
        soundManager.ctx.resume();
    }

    if (player.controls.isLocked && weapon.canShoot()) {
        const hit = weapon.shoot(engine.camera, enemies, level.walls);

        if (hit && hit.enemy.isDead()) {
            killCount++;
            updateKillHUD();
            setTimeout(() => {
                engine.scene.remove(hit.enemy.mesh);
                const index = enemies.indexOf(hit.enemy);
                if (index > -1) enemies.splice(index, 1);
            }, 500);
        }
    }
});

// Initial spawn
spawnEnemies(10);

animate();

// Initial spawn position
engine.camera.position.set(0, 1.6, 0);

// Pause Menu Functionality
const pauseMenu = document.getElementById('pause-menu');
const resumeBtn = document.getElementById('resume-btn');
const menuBtn = document.getElementById('menu-btn');
const sensitivitySlider = document.getElementById('sensitivity-slider');
const sensitivityValue = document.getElementById('sensitivity-value');
const quizOverlay = document.getElementById('quiz-overlay');

let isPaused = false;

const minSens = 0.001;
const maxSens = 0.5;
const rangeSens = maxSens - minSens;

const sensitivityToSlider = (sens) => Math.round(((sens - minSens) / rangeSens) * 99) + 1;
const sliderToSensitivity = (val) => minSens + ((val - 1) / 99) * rangeSens;

// Initialize slider with current sensitivity
const currentSens = parseFloat(localStorage.getItem('mouseSensitivity')) || 0.5;
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
    player.controls.lock();
}

// DETECT POINTER UNLOCK (Pressed ESC or lost focus)
player.controls.addEventListener('unlock', () => {
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
    if (soundManager.ctx.state === 'suspended') soundManager.ctx.resume();
});

// Handle ESC key - only needed to close menu if already open
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
    location.reload();
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

    // Show modal BEFORE unlocking to prevent Pause Menu from triggering via 'unlock' event
    modal.classList.add('show');
    player.controls.unlock();

    // Setup next level button
    const nextBtn = document.getElementById('next-level-btn');
    nextBtn.onclick = () => {
        player.controls.lock();

        modal.classList.remove('show');

        // Load next level
        level.loadLevel(nextLevel);
        document.getElementById('level-indicator').textContent = "LEVEL " + nextLevel;
        quizManager.resetLevel(level.questions.length);
        spawnEnemies(10 + (nextLevel * 3));
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

    player.controls.unlock();
    modal.classList.add('show');
}

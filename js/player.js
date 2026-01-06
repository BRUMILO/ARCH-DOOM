import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(camera, domElement) {
        this.camera = camera;
        this.controls = new PointerLockControls(camera, document.body);

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

        this.speed = 1.5; // Movement speed (Effective now)
        this.mouseSensitivity = parseFloat(localStorage.getItem('mouseSensitivity')) || 0.002;

        // Health and Shield
        this.health = 100;
        this.shield = 100;
        this.maxHealth = 100;
        this.maxShield = 100;

        // Raycaster for collision detection
        this.raycaster = new THREE.Raycaster();
        this.collisionDistance = 0.5; // Minimum distance from walls

        this.setupControls();
        this.setupEventListeners();
    }

    setupControls() {
        // Apply mouse sensitivity
        this.controls.pointerSpeed = this.mouseSensitivity;

        // Start game on click
        const startBtn = document.getElementById('start-btn');
        startBtn.addEventListener('click', () => {
            this.controls.lock();
            document.getElementById('start-screen').style.display = 'none';
        });

        this.controls.addEventListener('unlock', () => {
            // Pause logic could go here
            // If strictly just gameplay, maybe show start screen again or pause menu
            // For now, we leave it simple.
        });
    }

    setupEventListeners() {
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }

    update(delta, collisionObjects = []) {
        if (this.controls.isLocked === true) {
            // Cap delta to prevent instability on frame drops
            const timeStep = Math.min(delta, 0.1);

            // Stable friction (exponential decay)
            // velocity * e^(-damping * dt)
            // 10.0 damping factor
            const friction = Math.exp(-10.0 * timeStep);
            this.velocity.x *= friction;
            this.velocity.z *= friction;

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize(); // Ensure consistent speed in all directions

            // Acceleration: speed * 50.0 gives good response with 10.0 damping
            // Previously hardcoded 400.0 was equivalent to speed 8.0
            const acceleration = this.speed * 50.0;

            if (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) {
                this.velocity.z -= this.direction.z * acceleration * timeStep;
                this.velocity.x -= this.direction.x * acceleration * timeStep;
            }

            // Calculate intended movement
            const moveX = -this.velocity.x * timeStep;
            const moveZ = -this.velocity.z * timeStep;

            // Check collisions before moving
            const canMoveX = this.checkCollision(collisionObjects, moveX, 0);
            const canMoveZ = this.checkCollision(collisionObjects, 0, moveZ);

            // Apply movement only if no collision detected
            if (canMoveX) {
                this.controls.moveRight(moveX);
            }
            if (canMoveZ) {
                this.controls.moveForward(moveZ);
            }

            // Simple Floor Collision
            if (this.camera.position.y < 1.6) {
                this.camera.position.y = 1.6;
                this.velocity.y = 0;
            }
        }
    }

    checkCollision(collisionObjects, moveX, moveZ) {
        if (collisionObjects.length === 0) return true;

        // Get camera direction for raycasting
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);

        // Calculate movement direction in world space
        const right = new THREE.Vector3();
        right.crossVectors(cameraDirection, this.camera.up).normalize();

        const forward = new THREE.Vector3();
        forward.copy(cameraDirection);
        forward.y = 0;
        forward.normalize();

        // Calculate the actual movement vector
        const movementVector = new THREE.Vector3();
        movementVector.addScaledVector(right, moveX);
        movementVector.addScaledVector(forward, moveZ);

        // If no movement, allow it
        if (movementVector.length() < 0.001) return true;

        movementVector.normalize();

        // Cast ray from camera position in movement direction
        this.raycaster.set(this.camera.position, movementVector);

        // Recursive necessary for Groups (Tron walls)
        const intersects = this.raycaster.intersectObjects(collisionObjects, true);

        // Check intersections
        for (let i = 0; i < intersects.length; i++) {
            const hit = intersects[i];

            // Ignore LineSegments (edges) and Triggers (if any ended up in list)
            // Only collide with solid Wall Meshes
            if (hit.object.type === 'LineSegments') continue;
            if (hit.object.userData && hit.object.userData.isTrigger) continue;

            if (hit.distance < this.collisionDistance) {
                return false; // Collision detected with solid wall
            }
        }

        return true; // No collision, allow movement

        return true; // No collision, allow movement
    }

    setMouseSensitivity(value) {
        this.mouseSensitivity = value;
        this.controls.pointerSpeed = value;
        localStorage.setItem('mouseSensitivity', value.toString());
    }

    takeDamage(amount) {
        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) {
                // Overflow damage to health
                this.health += this.shield;
                this.shield = 0;
            }
        } else {
            this.health -= amount;
        }

        this.health = Math.max(0, this.health);
        this.updateHUD();

        // Show damage overlay
        const overlay = document.getElementById('damage-overlay');
        if (overlay) {
            overlay.style.opacity = '1';
            setTimeout(() => {
                overlay.style.opacity = '0';
            }, 400); // Longer duration
        }

        // Trigger Screen Shake
        document.body.classList.add('shake-effect');
        setTimeout(() => {
            document.body.classList.remove('shake-effect');
        }, 300);

        if (this.health <= 0) {
            this.die();
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.updateHUD();
    }

    updateHUD() {
        const healthEl = document.getElementById('health');
        const shieldEl = document.getElementById('shield');

        if (healthEl) healthEl.textContent = Math.floor(this.health);
        if (shieldEl) shieldEl.textContent = Math.floor(this.shield);
    }

    die() {
        // Unlock cursor so user can click
        this.controls.unlock();

        // Show arcade game over modal
        const modal = document.getElementById('game-over-modal');
        modal.classList.add('show');
    }
}

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

        this.speed = 1.5;
        this.mouseSensitivity = parseFloat(localStorage.getItem('mouseSensitivity')) || 0.002;

        // Health and Shield
        this.health = 100;
        this.shield = 100;
        this.maxHealth = 100;
        this.maxShield = 100;

        // Raycaster for collision detection
        this.raycaster = new THREE.Raycaster();
        this.collisionDistance = 0.5;

        this.setupControls();
        this.setupEventListeners();
    }

    setupControls() {
        this.controls.pointerSpeed = this.mouseSensitivity;

        const startBtn = document.getElementById('start-btn');
        startBtn.addEventListener('click', () => {
            this.controls.lock();
            document.getElementById('start-screen').style.display = 'none';
        });

        this.controls.addEventListener('unlock', () => {
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
            // Clamp delta to prevent huge jumps on lag spikes
            const timeStep = Math.min(delta, 0.05);

            const friction = Math.exp(-10.0 * timeStep);
            this.velocity.x *= friction;
            this.velocity.z *= friction;

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();

            const acceleration = this.speed * 60.0;

            if (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) {
                this.velocity.z -= this.direction.z * acceleration * timeStep;
                this.velocity.x -= this.direction.x * acceleration * timeStep;
            }

            // Cap velocity to avoid tunneling
            const maxVelocity = 15.0;
            this.velocity.x = Math.max(Math.min(this.velocity.x, maxVelocity), -maxVelocity);
            this.velocity.z = Math.max(Math.min(this.velocity.z, maxVelocity), -maxVelocity);

            const moveX = -this.velocity.x * timeStep;
            const moveZ = -this.velocity.z * timeStep;

            // 1. Raycast check for movement blocking (Prevent entering)
            const canMoveX = this.checkCollision(collisionObjects, moveX, 0);
            const canMoveZ = this.checkCollision(collisionObjects, 0, moveZ);

            if (canMoveX) this.controls.moveRight(moveX);
            if (canMoveZ) this.controls.moveForward(moveZ);

            // 2. Sphere-box overlap resolution (Eject if inside)
            this.resolveWallOverlaps(collisionObjects);

            // Floor clamp
            if (this.camera.position.y < 1.6) {
                this.camera.position.y = 1.6;
                this.velocity.y = 0;
            }
        }
    }

    resolveWallOverlaps(collisionObjects) {
        const playerRadius = 0.4;
        const pPos = this.camera.position;

        // We only care about X/Z plane overlap
        for (const obj of collisionObjects) {
            // Optimization: Skip walls far away
            // Wall groups have position at center. Cell size is 4.
            // If distance > 3.0, impossible to collide (player radius < 0.5, wall radius < 2.8)
            if (pPos.distanceTo(obj.position) > 3.0) continue;

            // Assuming walls are BoxGeometry
            if (!obj.geometry || !obj.geometry.boundingBox) continue;
            if (obj.userData && obj.userData.isTrigger) continue; // Ignore triggers

            // Update wall bounding box world coords if needed (usually static, but good to be safe)
            // Simple AABB check
            // Walls are cellSize centered.
            // We can approximate wall as Box (min, max)

            // Simplification: Check distance to wall center?
            // Or better: Use Box3.
            const wallBox = new THREE.Box3().setFromObject(obj);
            const playerBox = new THREE.Box3(
                new THREE.Vector3(pPos.x - playerRadius, -10, pPos.z - playerRadius),
                new THREE.Vector3(pPos.x + playerRadius, 10, pPos.z + playerRadius)
            );

            if (wallBox.intersectsBox(playerBox)) {
                // Get overlap depth
                // Find closest point on wall AABB to player center
                const clampedX = Math.max(wallBox.min.x, Math.min(wallBox.max.x, pPos.x));
                const clampedZ = Math.max(wallBox.min.z, Math.min(wallBox.max.z, pPos.z));

                const dx = pPos.x - clampedX;
                const dz = pPos.z - clampedZ;
                const distSq = dx * dx + dz * dz;

                if (distSq > 0 && distSq < playerRadius * playerRadius) {
                    const dist = Math.sqrt(distSq);
                    const pushX = (dx / dist) * (playerRadius - dist);
                    const pushZ = (dz / dist) * (playerRadius - dist);

                    // Push camera directly
                    this.camera.position.x += pushX;
                    this.camera.position.z += pushZ;
                } else if (distSq === 0) {
                    // Deep overlap (center inside box), push to nearest edge
                    const dMinX = Math.abs(pPos.x - wallBox.min.x);
                    const dMaxX = Math.abs(pPos.x - wallBox.max.x);
                    const dMinZ = Math.abs(pPos.z - wallBox.min.z);
                    const dMaxZ = Math.abs(pPos.z - wallBox.max.z);

                    const min = Math.min(dMinX, dMaxX, dMinZ, dMaxZ);

                    if (min === dMinX) this.camera.position.x -= (min + 0.01);
                    else if (min === dMaxX) this.camera.position.x += (min + 0.01);
                    else if (min === dMinZ) this.camera.position.z -= (min + 0.01);
                    else if (min === dMaxZ) this.camera.position.z += (min + 0.01);
                }
            }
        }
    }

    checkCollision(collisionObjects, moveX, moveZ) {
        if (collisionObjects.length === 0) return true;

        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);

        const right = new THREE.Vector3();
        right.crossVectors(cameraDirection, this.camera.up).normalize();

        const forward = new THREE.Vector3();
        forward.copy(cameraDirection);
        forward.y = 0;
        forward.normalize();

        const movementVector = new THREE.Vector3();
        movementVector.addScaledVector(right, moveX);
        movementVector.addScaledVector(forward, moveZ);

        if (movementVector.length() < 0.001) return true;

        // Raycast Length: Movement + Buffer (0.5)
        // Check WAIST level (camera.y - 0.6) to hit low walls?
        // Actually camera height is 1.6. Waist is ~1.0.

        const origin = this.camera.position.clone();
        // Lower origin slightly to hit walls better? Walls are height 4, so camera height is fine.

        const distToCheck = movementVector.length() + this.collisionDistance;

        movementVector.normalize();
        this.raycaster.set(origin, movementVector);
        this.raycaster.far = distToCheck;

        const intersects = this.raycaster.intersectObjects(collisionObjects, true);

        for (let i = 0; i < intersects.length; i++) {
            const hit = intersects[i];
            if (hit.object.type === 'LineSegments') continue;
            if (hit.object.userData && hit.object.userData.isTrigger) continue;

            // Valid collision
            return false;
        }

        return true;
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
            }, 400);
        }

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
        this.controls.unlock();
        const modal = document.getElementById('game-over-modal');
        modal.classList.add('show');
    }
}

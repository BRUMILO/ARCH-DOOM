import * as THREE from 'three';

export class Enemy {
    constructor(scene, level) {
        this.scene = scene;
        this.level = level;

        // Stats
        this.health = 50;
        this.shield = 50;
        this.maxHealth = 50;
        this.maxShield = 50;
        this.speed = 2.0;
        this.detectionRange = 10;
        this.attackRange = 1.5;
        this.attackDamage = 10;
        this.attackCooldown = 2.0;
        this.lastAttack = 0;

        // AI state
        this.state = 'patrol';
        this.patrolTarget = null;
        this.patrolWaitTime = 0;

        // Create drone mesh group
        this.mesh = new THREE.Group();

        // 1. Core (Glowing Sphere)
        const coreGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.mesh.add(this.core);

        // 2. Rotating Ring (Torus)
        const ringGeo = new THREE.TorusGeometry(0.6, 0.05, 8, 32);
        const ringMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        this.ring = new THREE.Mesh(ringGeo, ringMat);
        this.mesh.add(this.ring);

        // 3. Spikes/Armor (Cones)
        const spikeGeo = new THREE.ConeGeometry(0.1, 0.4, 8);
        const spikeMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

        const spikes = [
            { x: 0.6, y: 0, z: 0, rotZ: -Math.PI / 2 },
            { x: -0.6, y: 0, z: 0, rotZ: Math.PI / 2 },
            { x: 0, y: 0, z: 0.6, rotX: Math.PI / 2 },
            { x: 0, y: 0, z: -0.6, rotX: -Math.PI / 2 }
        ];

        spikes.forEach(s => {
            const spike = new THREE.Mesh(spikeGeo, spikeMat);
            spike.position.set(s.x, s.y, s.z);
            if (s.rotZ) spike.rotation.z = s.rotZ;
            if (s.rotX) spike.rotation.x = s.rotX;
            this.mesh.add(spike);
        });

        // Add glow light
        const light = new THREE.PointLight(0xff3300, 1, 3);
        this.mesh.add(light);


        // Spawn at valid position
        this.spawnAtValidPosition();

        this.scene.add(this.mesh);

        // Raycaster for wall collision
        this.raycaster = new THREE.Raycaster();
    }

    spawnAtValidPosition() {
        // Trust the grid map first
        const map = this.level.maps[this.level.currentLevelIndex];
        if (!map) return;

        const validPositions = [];
        const floorY = 0.8;

        for (let z = 0; z < map.length; z++) {
            for (let x = 0; x < map[z].length; x++) {
                if (map[z][x] === 0) {
                    validPositions.push({
                        x: x * this.level.cellSize - 20,
                        z: z * this.level.cellSize - 20
                    });
                }
            }
        }

        if (validPositions.length > 0) {
            const pos = validPositions[Math.floor(Math.random() * validPositions.length)];
            const offsetX = (Math.random() - 0.5) * 2.0;
            const offsetZ = (Math.random() - 0.5) * 2.0;

            this.mesh.position.set(pos.x + offsetX, floorY, pos.z + offsetZ);
        } else {
            this.mesh.position.set(0, floorY, 5);
        }
    }

    update(delta, playerPos) {
        if (this.isDead()) return;

        // Active Wall Separation: Push out if inside wall
        this.resolveWallCollisions();

        // Animate drone: float and rotate ring
        this.ring.rotation.x += 2 * delta;
        this.ring.rotation.y += 2 * delta;
        this.mesh.position.y = 0.8 + Math.sin(performance.now() / 500) * 0.1;

        const distanceToPlayer = this.mesh.position.distanceTo(playerPos);

        // State machine
        if (distanceToPlayer < this.detectionRange) {
            this.state = 'chase';
            this.chasePlayer(delta, playerPos);
        } else {
            this.state = 'patrol';
            this.patrol(delta);
        }
    }

    resolveWallCollisions() {
        const radius = 0.7;
        const walls = this.level.walls;
        const wallHalfSize = 2.0;

        for (const wallGroup of walls) {
            const wx = wallGroup.position.x;
            const wz = wallGroup.position.z;
            const ex = this.mesh.position.x;
            const ez = this.mesh.position.z;

            const clampedX = Math.max(wx - wallHalfSize, Math.min(wx + wallHalfSize, ex));
            const clampedZ = Math.max(wz - wallHalfSize, Math.min(wz + wallHalfSize, ez));

            const dx = ex - clampedX;
            const dz = ez - clampedZ;
            const distSq = dx * dx + dz * dz;

            if (distSq < radius * radius && distSq > 0.0001) {
                const dist = Math.sqrt(distSq);
                const overlap = radius - dist;
                this.mesh.position.x += (dx / dist) * overlap;
                this.mesh.position.z += (dz / dist) * overlap;
            } else if (distSq < 0.0001) {
                // Inside wall logic
                const distLeft = ex - (wx - wallHalfSize);
                const distRight = (wx + wallHalfSize) - ex;
                const distTop = ez - (wz - wallHalfSize);
                const distBottom = (wz + wallHalfSize) - ez;
                const min = Math.min(distLeft, distRight, distTop, distBottom);

                if (min === distLeft) this.mesh.position.x -= (min + 0.1);
                else if (min === distRight) this.mesh.position.x += (min + 0.1);
                else if (min === distTop) this.mesh.position.z -= (min + 0.1);
                else if (min === distBottom) this.mesh.position.z += (min + 0.1);
            }
        }
    }

    chasePlayer(delta, playerPos) {
        // Move towards player
        const direction = new THREE.Vector3();
        direction.subVectors(playerPos, this.mesh.position);
        direction.y = 0; // Keep on ground
        direction.normalize();

        // --- ENHANCED COLLISION DETECTION (Whiskers) ---
        const moveDistance = this.speed * delta;
        const collisionThreshold = 1.0;

        // 1. Center Ray
        if (this.checkCollision(direction, collisionThreshold)) {
            // Try sliding
            const leftDir = direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);
            const rightDir = direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 4);

            if (!this.checkCollision(leftDir, collisionThreshold)) {
                this.mesh.position.addScaledVector(leftDir, moveDistance);
                return;
            } else if (!this.checkCollision(rightDir, collisionThreshold)) {
                this.mesh.position.addScaledVector(rightDir, moveDistance);
                return;
            }
            return;
        }

        // Safe to move
        this.mesh.position.addScaledVector(direction, moveDistance);
    }

    checkCollision(direction, distance) {
        this.raycaster.set(this.mesh.position, direction);
        this.raycaster.far = distance;

        const walls = this.level.walls;
        const intersects = this.raycaster.intersectObjects(walls, true);

        return intersects.some(i => i.object.type === 'Mesh' && i.distance < distance);
    }

    patrol(delta) {
        // Simple patrol: pick random target, move to it, wait, repeat
        if (!this.patrolTarget || this.patrolWaitTime > 0) {
            this.patrolWaitTime -= delta;

            if (this.patrolWaitTime <= 0 && !this.patrolTarget) {
                // Pick new random nearby target
                const angle = Math.random() * Math.PI * 2;
                const distance = 3 + Math.random() * 3;
                this.patrolTarget = new THREE.Vector3(
                    this.mesh.position.x + Math.cos(angle) * distance,
                    this.mesh.position.y,
                    this.mesh.position.z + Math.sin(angle) * distance
                );
            }
            return;
        }

        // Move to patrol target
        const direction = new THREE.Vector3();
        direction.subVectors(this.patrolTarget, this.mesh.position);
        direction.y = 0;

        if (direction.length() < 0.5) {
            this.patrolTarget = null;
            this.patrolWaitTime = 1 + Math.random() * 2;
            return;
        }

        direction.normalize();
        this.mesh.position.addScaledVector(direction, this.speed * 0.5 * delta);
    }

    takeDamage() {
        if (this.shield > 0) {
            this.shield -= 25;
            if (this.shield < 0) {
                // Overflow damage to health
                this.health += this.shield;
                this.shield = 0;
            }
        } else {
            this.health -= 50;
        }

        this.health = Math.max(0, this.health);

        if (this.isDead()) {
            this.die();
        }
    }

    isDead() {
        return this.health <= 0;
    }

    die() {
        this.core.material.color.setHex(0x444444);
        this.core.material.transparent = true;
        this.core.material.opacity = 0.3;
        this.ring.visible = false;
    }

    canAttack() {
        const now = performance.now() / 1000;
        return (now - this.lastAttack) >= this.attackCooldown;
    }

    resetAttackCooldown() {
        this.lastAttack = performance.now() / 1000;
    }

    getAttackDamage() {
        return this.attackDamage;
    }
}

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
        this.attackCooldown = 2.0; // Seconds
        this.lastAttack = 0;

        // AI state
        this.state = 'patrol';
        this.patrolTarget = null;
        this.patrolWaitTime = 0;

        // Create mesh
        const geometry = new THREE.BoxGeometry(0.8, 1.6, 0.8);
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);

        // Spawn at valid position
        this.spawnAtValidPosition();

        this.scene.add(this.mesh);

        // Raycaster for wall collision
        this.raycaster = new THREE.Raycaster();
    }

    spawnAtValidPosition() {
        const map = this.level.maps[this.level.currentLevelIndex];
        if (!map) return;

        const validPositions = [];

        // Find empty cells (0 or 9)
        for (let z = 0; z < map.length; z++) {
            for (let x = 0; x < map[z].length; x++) {
                const type = map[z][x];
                if (type === 0) { // Empty space
                    validPositions.push({
                        x: x * this.level.cellSize - 20,
                        z: z * this.level.cellSize - 20
                    });
                }
            }
        }

        // Pick random valid position
        if (validPositions.length > 0) {
            const pos = validPositions[Math.floor(Math.random() * validPositions.length)];
            this.mesh.position.set(pos.x, 0.8, pos.z);
        } else {
            // Fallback
            this.mesh.position.set(0, 0.8, 5);
        }
    }

    update(delta, playerPos) {
        if (this.isDead()) return;

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

    chasePlayer(delta, playerPos) {
        // Move towards player
        const direction = new THREE.Vector3();
        direction.subVectors(playerPos, this.mesh.position);
        direction.y = 0; // Keep on ground
        direction.normalize();

        // Check if path is clear before moving
        this.raycaster.set(this.mesh.position, direction);
        this.raycaster.far = this.speed * delta + 0.5;

        const walls = this.level.walls;
        const intersects = this.raycaster.intersectObjects(walls);

        // Only move if no wall in the way
        if (intersects.length === 0 || intersects[0].distance > this.speed * delta) {
            this.mesh.position.addScaledVector(direction, this.speed * delta);
        }
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
            // Reached target
            this.patrolTarget = null;
            this.patrolWaitTime = 1 + Math.random() * 2; // Wait 1-3 seconds
            return;
        }

        direction.normalize();
        this.mesh.position.addScaledVector(direction, this.speed * 0.5 * delta); // Slower patrol
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
        // Change color to indicate death
        this.mesh.material.color.setHex(0x444444);
        this.mesh.material.transparent = true;
        this.mesh.material.opacity = 0.3;
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

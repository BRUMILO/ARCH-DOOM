import * as THREE from 'three';

export class Weapon {
    constructor(scene) {
        this.scene = scene;
        this.raycaster = new THREE.Raycaster();
        this.fireRate = 0.2; // Seconds between shots (5 shots/sec)
        this.lastShot = 0;
        this.range = 50; // Maximum range

        // Visual effects
        this.muzzleFlash = null;
        this.createMuzzleFlash();
    }

    createMuzzleFlash() {
        // Create a bright sprite for muzzle flash
        const geometry = new THREE.PlaneGeometry(0.3, 0.3);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        this.muzzleFlash = new THREE.Mesh(geometry, material);
        this.muzzleFlash.visible = false;
    }

    canShoot() {
        const now = performance.now() / 1000;
        return (now - this.lastShot) >= this.fireRate;
    }

    shoot(camera, enemies) {
        if (!this.canShoot()) return null;

        this.lastShot = performance.now() / 1000;

        // Get camera direction
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);

        // Setup raycaster from camera position
        this.raycaster.set(camera.position, direction);
        this.raycaster.far = this.range;

        // Check for hits on enemies
        const enemyMeshes = enemies.filter(e => !e.isDead()).map(e => e.mesh);
        const intersects = this.raycaster.intersectObjects(enemyMeshes);

        let hitPoint = null;
        let hitEnemy = null;

        if (intersects.length > 0) {
            // Hit an enemy
            const hitMesh = intersects[0].object;
            hitEnemy = enemies.find(e => e.mesh === hitMesh);
            hitPoint = intersects[0].point;

            if (hitEnemy) {
                hitEnemy.takeDamage();
                this.showHitEffect(hitEnemy);
            }
        } else {
            // Calculate miss point at max range
            hitPoint = new THREE.Vector3();
            hitPoint.copy(direction).multiplyScalar(this.range).add(camera.position);
        }

        // Show visual effects
        this.showMuzzleFlash(camera);
        this.showTracer(camera.position, hitPoint);

        return hitEnemy ? {
            enemy: hitEnemy,
            distance: intersects[0].distance,
            point: intersects[0].point
        } : null;
    }

    showMuzzleFlash(camera) {
        // Position flash slightly in front of camera
        this.muzzleFlash.position.copy(camera.position);

        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        this.muzzleFlash.position.addScaledVector(direction, 0.5);

        // Make it face the camera
        this.muzzleFlash.lookAt(camera.position);

        // Show flash
        this.muzzleFlash.visible = true;
        this.muzzleFlash.material.opacity = 0.8;
        this.scene.add(this.muzzleFlash);

        // Fade out quickly
        setTimeout(() => {
            if (this.muzzleFlash) {
                this.muzzleFlash.visible = false;
                this.scene.remove(this.muzzleFlash);
            }
        }, 50);
    }

    showTracer(start, end) {
        // Offset start slightly below camera (like holding a gun)
        const gunOffset = new THREE.Vector3(0.2, -0.2, 0.5);
        // We can't easily calculate relative gun position without player mesh, 
        // so just starting from slightly below camera center is fine
        const startPos = start.clone();

        // Slightly lower than eye level
        startPos.y -= 0.2;

        // Create line geometry for bullet tracer
        const points = [startPos, end.clone()];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineBasicMaterial({
            color: 0x00ffff, // Cyan tracer
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });

        const tracer = new THREE.Line(geometry, material);
        this.scene.add(tracer);

        // Remove tracer after short duration
        setTimeout(() => {
            this.scene.remove(tracer);
            geometry.dispose();
            material.dispose();
        }, 100);
    }

    showHitEffect(enemy) {
        // Flash the enemy white briefly
        const originalColor = enemy.mesh.material.color.clone();
        enemy.mesh.material.color.setHex(0xffffff);

        // Create impact particles/flash at hit point
        const impactFlash = new THREE.PointLight(0xff0000, 2, 3);
        impactFlash.position.copy(enemy.mesh.position);
        this.scene.add(impactFlash);

        setTimeout(() => {
            if (!enemy.isDead()) {
                enemy.mesh.material.color.copy(originalColor);
            }
            this.scene.remove(impactFlash);
        }, 100);
    }
}

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
        // Use recursive=true to hit sub-objects (core, ring, spikes)
        const intersects = this.raycaster.intersectObjects(enemyMeshes, true);

        let hitPoint = null;
        let hitEnemy = null;

        if (intersects.length > 0) {
            // Hit an enemy part
            const hitObject = intersects[0].object;
            // Find enemy that owns this part (check if mesh matches or is parent)
            hitEnemy = enemies.find(e => e.mesh === hitObject || e.mesh === hitObject.parent);
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
        if (!this.muzzleFlash) return;

        // Position flash slightly in front of camera
        this.muzzleFlash.position.copy(camera.position);

        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        this.muzzleFlash.position.addScaledVector(direction, 0.5);

        // Make it face the camera
        this.muzzleFlash.lookAt(camera.position);

        // Update flash color to Cyan
        if (this.muzzleFlash.material) {
            this.muzzleFlash.material.color.setHex(0x00ffff);
        }

        // Show flash
        this.muzzleFlash.visible = true;
        this.muzzleFlash.material.opacity = 1;
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
        // Calculate length and direction
        const distance = start.distanceTo(end);
        const direction = new THREE.Vector3().subVectors(end, start).normalize();

        // Create Cylinder Beam
        const geometry = new THREE.CylinderGeometry(0.05, 0.05, distance, 6);
        geometry.rotateX(-Math.PI / 2); // Align with Z axis

        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff, // Cyan laser
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const beam = new THREE.Mesh(geometry, material);

        // Position beam at midpoint
        const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        beam.position.copy(midpoint);
        beam.lookAt(end);

        // Offset slightly down (weapon height)
        beam.position.y -= 0.1;

        this.scene.add(beam);

        // Remove beam after short duration
        setTimeout(() => {
            this.scene.remove(beam);
            geometry.dispose();
            material.dispose();
        }, 80);

        // Create impact particles at end point
        this.createImpactParticles(end);
    }

    createImpactParticles(position) {
        const particleCount = 12;
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });

        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);

            // Random velocity
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4
            );

            particle.userData = { velocity: velocity };
            this.scene.add(particle);
            particles.push(particle);
        }

        // Animate particles
        const animateParticles = () => {
            let active = false;
            particles.forEach(p => {
                if (p.visible) {
                    p.position.add(p.userData.velocity.multiplyScalar(0.1)); // Slow down simulation step
                    p.scale.multiplyScalar(0.9); // Shrink
                    if (p.scale.x < 0.01) {
                        p.visible = false;
                        this.scene.remove(p);
                    } else {
                        active = true;
                    }
                }
            });

            if (active) {
                requestAnimationFrame(animateParticles);
            } else {
                geometry.dispose();
                material.dispose();
            }
        };

        animateParticles();
    }

    showHitEffect(enemy) {
        // Flash the enemy core white briefly
        const targetMesh = enemy.core || enemy.mesh;

        if (targetMesh.material) {
            const originalColor = targetMesh.material.color.clone();
            targetMesh.material.color.setHex(0xffffff);

            setTimeout(() => {
                if (!enemy.isDead() && targetMesh.material) {
                    targetMesh.material.color.copy(originalColor);
                }
            }, 100);
        }

        // Impact particles are already handled by showTracer's call to createImpactParticles
        // But we add a light flash here specifically for enemy hits
        const impactFlash = new THREE.PointLight(0xff0000, 2, 3);
        impactFlash.position.copy(enemy.mesh.position);
        this.scene.add(impactFlash);

        setTimeout(() => {
            this.scene.remove(impactFlash);
        }, 100);
    }
}

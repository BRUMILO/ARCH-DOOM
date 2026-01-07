import * as THREE from 'three';

export class Weapon {
    constructor(scene, camera, soundManager) {
        this.scene = scene;
        this.camera = camera;
        this.soundManager = soundManager;
        this.raycaster = new THREE.Raycaster();
        this.fireRate = 0.2;
        this.lastShot = 0;
        this.range = 50;

        // Weapon Model Container
        this.weaponGroup = new THREE.Group();
        this.camera.add(this.weaponGroup);
        this.muzzleOffset = new THREE.Object3D();
        this.createWeaponModel();
        this.muzzleFlash = null;
        this.createMuzzleFlash();
    }

    createWeaponModel() {
        // Detailed Retro Blaster Model

        // 1. Main Housing (Dark Tech Grey)
        const bodyGeo = new THREE.BoxGeometry(0.12, 0.14, 0.45);
        const bodyMat = new THREE.MeshBasicMaterial({ color: 0x2a2a35 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 0, 0);

        // 2. Barrel Logic (Energy Core)
        const barrelGeo = new THREE.BoxGeometry(0.06, 0.06, 0.5);
        const barrelMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set(0, 0.02, -0.15);

        // 3. Barrel Shroud (Top/Bottom Plates)
        const shroudGeo = new THREE.BoxGeometry(0.1, 0.02, 0.35);
        const shroudMat = new THREE.MeshBasicMaterial({ color: 0x4a4a55 });

        const topShroud = new THREE.Mesh(shroudGeo, shroudMat);
        topShroud.position.set(0, 0.08, -0.1);

        const bottomShroud = new THREE.Mesh(shroudGeo, shroudMat);
        bottomShroud.position.set(0, -0.06, -0.1);

        // 4. Rear Grip/Handle
        const gripGeo = new THREE.BoxGeometry(0.08, 0.15, 0.12);
        const gripMat = new THREE.MeshBasicMaterial({ color: 0x1a1a22 });
        const grip = new THREE.Mesh(gripGeo, gripMat);
        grip.position.set(0, -0.1, 0.15);

        // 5. Side Vents (Glowing)
        const ventGeo = new THREE.BoxGeometry(0.13, 0.04, 0.2);
        const ventMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        const vents = new THREE.Mesh(ventGeo, ventMat);
        vents.position.set(0, 0, 0.05);

        // 6. Scope/Sight
        const scopeBaseGeo = new THREE.BoxGeometry(0.04, 0.04, 0.2);
        const scopeBaseMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const scope = new THREE.Mesh(scopeBaseGeo, scopeBaseMat);
        scope.position.set(0, 0.1, 0.05);

        // Assemble Weapon Group
        this.weaponGroup.add(body);
        this.weaponGroup.add(barrel);
        this.weaponGroup.add(topShroud);
        this.weaponGroup.add(bottomShroud);
        this.weaponGroup.add(grip);
        this.weaponGroup.add(vents);
        this.weaponGroup.add(scope);

        // Position attached to camera
        this.weaponGroup.position.set(0.25, -0.25, -0.5);

        // Setup Muzzle Offset
        barrel.add(this.muzzleOffset);
        this.muzzleOffset.position.set(0, 0, -0.25);
    }

    createMuzzleFlash() {
        // Muzzle Flash is now attached to the weapon/muzzle
        const geometry = new THREE.PlaneGeometry(0.15, 0.15);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        this.muzzleFlash = new THREE.Mesh(geometry, material);
        this.muzzleFlash.visible = false;

        // Attach to muzzle offset
        this.muzzleOffset.add(this.muzzleFlash);
    }

    canShoot() {
        const now = performance.now() / 1000;
        return (now - this.lastShot) >= this.fireRate;
    }

    shoot(camera, enemies, walls) {
        if (!this.canShoot()) return null;

        this.lastShot = performance.now() / 1000;

        // Play Sound
        if (this.soundManager) {
            this.soundManager.play('shoot');
        }

        // --- 1. LOGICAL HIT DETECTION  ---
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);

        this.raycaster.set(camera.position, direction);
        this.raycaster.far = this.range;

        let wallHitDistance = Infinity;
        let wallHitPoint = null;

        if (walls) {
            const wallIntersects = this.raycaster.intersectObjects(walls, true);
            const solidWallHit = wallIntersects.find(i => i.object.type === 'Mesh');
            if (solidWallHit) {
                wallHitDistance = solidWallHit.distance;
                wallHitPoint = solidWallHit.point;
            }
        }

        const enemyMeshes = enemies.filter(e => !e.isDead()).map(e => e.mesh);
        const enemyIntersects = this.raycaster.intersectObjects(enemyMeshes, true);

        let hitPoint = null;
        let hitEnemy = null;
        let finalDistance = this.range;

        if (enemyIntersects.length > 0) {
            const hitObject = enemyIntersects[0].object;
            const dist = enemyIntersects[0].distance;

            if (wallHitDistance < dist) {
                hitPoint = wallHitPoint;
                finalDistance = wallHitDistance;
                this.createImpactParticles(wallHitPoint);
            } else {
                // Hit Enemy
                hitEnemy = enemies.find(e => e.mesh === hitObject || e.mesh === hitObject.parent);
                hitPoint = enemyIntersects[0].point;
                finalDistance = dist;

                if (hitEnemy) {
                    hitEnemy.takeDamage();
                    this.showHitEffect(hitEnemy);
                }
            }
        } else if (wallHitDistance < Infinity) {
            // Hit Wall
            hitPoint = wallHitPoint;
            finalDistance = wallHitDistance;
            this.createImpactParticles(wallHitPoint);
        } else {
            // Miss (Point in infinity)
            hitPoint = new THREE.Vector3();
            hitPoint.copy(direction).multiplyScalar(this.range).add(camera.position);
        }

        // --- 2. VISUALS (From Weapon Muzzle) ---
        this.animateRecoil();
        this.showMuzzleFlash();

        // Calculate World Position of Muzzle for the tracer start point
        const muzzleWorldPos = new THREE.Vector3();
        this.muzzleOffset.getWorldPosition(muzzleWorldPos);

        this.showTracer(muzzleWorldPos, hitPoint);

        return hitEnemy ? {
            enemy: hitEnemy,
            distance: finalDistance,
            point: hitPoint
        } : null;
    }

    animateRecoil() {
        // Simple kickback
        this.weaponGroup.position.z += 0.1;
        setTimeout(() => {
            this.weaponGroup.position.z -= 0.1;
        }, 50);
    }

    showMuzzleFlash() {
        if (!this.muzzleFlash) return;

        // Random rotation for variety
        this.muzzleFlash.rotation.z = Math.random() * Math.PI;

        this.muzzleFlash.visible = true;
        this.muzzleFlash.material.opacity = 0.6;

        setTimeout(() => {
            if (this.muzzleFlash) {
                this.muzzleFlash.visible = false;
            }
        }, 50);
    }

    showTracer(start, end) {
        // Calculate length and direction
        const distance = start.distanceTo(end);

        // Create Cylinder Beam
        const geometry = new THREE.CylinderGeometry(0.02, 0.02, distance, 6);
        geometry.rotateX(-Math.PI / 2);

        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const beam = new THREE.Mesh(geometry, material);

        // Position beam at midpoint
        const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        beam.position.copy(midpoint);
        beam.lookAt(end);

        this.scene.add(beam);

        // Remove beam after short duration
        setTimeout(() => {
            this.scene.remove(beam);
            geometry.dispose();
            material.dispose();
        }, 80);
    }

    createImpactParticles(position) {
        const particleCount = 8;
        const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });

        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);

            // Random spread
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3
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
                    p.position.add(p.userData.velocity.multiplyScalar(0.05));
                    p.scale.multiplyScalar(0.9);
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
        // Flash enemy
        const targetMesh = enemy.core || enemy.mesh;

        if (targetMesh.material) {
            const originalColor = targetMesh.material.color.clone();
            targetMesh.material.color.setHex(0xffffff);

            setTimeout(() => {
                if (!enemy.isDead() && targetMesh.material) {
                    targetMesh.material.color.copy(originalColor);
                }
            }, 50);
        }
    }
}

import * as THREE from 'three';

export class Level {
    constructor(scene) {
        this.scene = scene;
        this.walls = [];
        this.questions = [];
        this.currentLevelIndex = 1;
        this.cellSize = 4;

        // Maps for 3 levels (1=Wall, 2=Question, 0=Air, 9=Start)
        this.maps = {
            1: [
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 9, 0, 0, 0, 0, 1, 2, 0, 0, 2, 1],
                [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
                [1, 0, 1, 2, 0, 0, 0, 0, 0, 1, 0, 1],
                [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
                [1, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 1],
                [1, 2, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
                [1, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 0, 1, 1, 1, 2, 1, 1, 0, 1],
                [1, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            ],
            2: [
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 9, 0, 2, 2, 0, 1, 0, 0, 0, 2, 0, 0, 1], // Added one '2'
                [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
                [1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 1],
                [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
                [1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 2, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
                [1, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 1], // Added one '2'
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            ],
            3: [
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 9, 0, 2, 0, 0, 0, 0, 2, 0, 0, 1],
                [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
                [1, 0, 1, 2, 0, 0, 0, 0, 2, 1, 0, 1],
                [1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
                [1, 2, 0, 0, 1, 2, 0, 1, 0, 0, 0, 1],
                [1, 1, 1, 0, 1, 2, 0, 1, 0, 1, 2, 1], // Added one '2'
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
                [1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            ]
        };
        this.cellSize = 4;
        this.initBase();
        this.loadLevel(1);
    }

    initBase() {
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(200, 200);
        const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3561 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);

        // Ceiling
        const ceilGeometry = new THREE.PlaneGeometry(200, 200);
        const ceilMaterial = new THREE.MeshLambertMaterial({ color: 0x0f1419 });
        const ceil = new THREE.Mesh(ceilGeometry, ceilMaterial);
        ceil.rotation.x = Math.PI / 2;
        ceil.position.y = 3;
        this.scene.add(ceil);
    }

    loadLevel(index) {
        this.currentLevelIndex = index;

        // Cleanup old level
        this.walls.forEach(w => this.scene.remove(w));
        this.questions.forEach(q => this.scene.remove(q));
        this.walls = [];
        this.questions = [];

        const map = this.maps[index];
        if (!map) return;

        // Wall & Trigger Materials
        const wallGeometry = new THREE.BoxGeometry(this.cellSize, 4, this.cellSize);
        const colors = [0xe74c3c, 0x16a085, 0x8e44ad]; // Vibrant colors per level (red, teal, purple)
        const wallMaterial = new THREE.MeshLambertMaterial({ color: colors[index - 1] || 0x95a5a6 });

        const triggerGeometry = new THREE.BoxGeometry(1, 1, 1);
        const triggerMaterial = new THREE.MeshBasicMaterial({ color: 0xf39c12, wireframe: true });

        for (let z = 0; z < map.length; z++) {
            for (let x = 0; x < map[z].length; x++) {
                const type = map[z][x];
                // 1 = Wall
                if (type === 1) {
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.set(x * this.cellSize - 20, 2, z * this.cellSize - 20);
                    this.scene.add(wall);
                    this.walls.push(wall);
                }
                // 2 = Question
                if (type === 2) {
                    const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
                    trigger.position.set(x * this.cellSize - 20, 1, z * this.cellSize - 20);
                    trigger.userData = { isTrigger: true, active: true, rotationSpeed: 2 };
                    this.scene.add(trigger);
                    this.questions.push(trigger);
                }
            }
        }
    }

    update(delta) {
        this.questions.forEach(q => {
            if (q.userData.active) {
                q.rotation.x += q.userData.rotationSpeed * delta;
                q.rotation.y += q.userData.rotationSpeed * delta;
            }
        });
    }
}

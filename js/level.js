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
        // Add Fog for depth and to hide edges
        this.scene.fog = new THREE.FogExp2(0x050510, 0.02);
        this.scene.background = new THREE.Color(0x050510);

        // Infinite Grid Floor
        const gridHelper = new THREE.GridHelper(200, 50, 0x222222, 0x111111);
        this.scene.add(gridHelper);

        // Reflective dark floor plane below grid to block void
        const floorGeometry = new THREE.PlaneGeometry(200, 200);
        const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x020205 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.1; // Slightly below grid
        this.scene.add(floor);

        // No ceiling needed, sky/void is better for cyber aesthetic
    }

    loadLevel(index) {
        this.currentLevelIndex = index;

        // Cleanup old level
        this.walls.forEach(w => {
            this.scene.remove(w);
            if (w.geometry) w.geometry.dispose();
            if (w.material) {
                if (Array.isArray(w.material)) w.material.forEach(m => m.dispose());
                else w.material.dispose();
            }
        });
        this.questions.forEach(q => this.scene.remove(q));
        this.walls = [];
        this.questions = [];

        const map = this.maps[index];
        if (!map) return;

        // Level Colors: Cyan, Magenta, Green
        const levelColors = [0x00ffff, 0xff00ff, 0x00ff00];
        const neonColor = levelColors[index - 1] || 0x00ffff;

        // Wall Materials
        const wallGeometry = new THREE.BoxGeometry(this.cellSize, 4, this.cellSize);
        const wallMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, // Black inner wall
            transparent: true,
            opacity: 0.9
        });

        const edgesGeometry = new THREE.EdgesGeometry(wallGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: neonColor,
            linewidth: 2
        });

        // Trigger Materials
        const triggerGeometry = new THREE.BoxGeometry(1, 1, 1);
        const triggerMaterial = new THREE.MeshBasicMaterial({ color: neonColor, wireframe: true });

        for (let z = 0; z < map.length; z++) {
            for (let x = 0; x < map[z].length; x++) {
                const type = map[z][x];
                // 1 = Wall
                if (type === 1) {
                    // Create Container for wall + edges
                    const wallGroup = new THREE.Group();
                    wallGroup.position.set(x * this.cellSize - 20, 2, z * this.cellSize - 20);

                    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
                    const edgeLines = new THREE.LineSegments(edgesGeometry, edgesMaterial);

                    wallGroup.add(wallMesh);
                    wallGroup.add(edgeLines);

                    this.scene.add(wallGroup);
                    this.walls.push(wallGroup);
                }
                // 2 = Question (Data Holocron)
                if (type === 2) {
                    const triggerGroup = new THREE.Group();
                    triggerGroup.position.set(x * this.cellSize - 20, 1.5, z * this.cellSize - 20);

                    // Holocron Geometries
                    const shellGeometry = new THREE.OctahedronGeometry(0.7, 0);
                    const coreGeometry = new THREE.IcosahedronGeometry(0.25, 0);
                    const shellMaterial = new THREE.MeshBasicMaterial({ color: neonColor, wireframe: true });
                    const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

                    // Outer Shell
                    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
                    triggerGroup.add(shell);

                    // Inner Core
                    const core = new THREE.Mesh(coreGeometry, coreMaterial);
                    triggerGroup.add(core);

                    // Point Light
                    // Use a slightly dimmer light to avoid blinding bloom
                    const light = new THREE.PointLight(neonColor, 0.8, 3);
                    triggerGroup.add(light);

                    triggerGroup.userData = {
                        isTrigger: true,
                        active: true,
                        shell: shell,
                        core: core,
                        initialY: 1.5
                    };

                    this.scene.add(triggerGroup);
                    this.questions.push(triggerGroup);
                }
            }
        }
    }

    update(delta) {
        const time = performance.now() / 1000;
        this.questions.forEach(q => {
            if (q.userData.active) {
                // Complex rotation
                if (q.userData.shell) {
                    q.userData.shell.rotation.y += delta;
                    q.userData.shell.rotation.z += delta * 0.5;
                }
                if (q.userData.core) {
                    q.userData.core.rotation.y -= delta * 2;
                    q.userData.core.rotation.x -= delta;
                }

                // Vertical bobbing
                q.position.y = q.userData.initialY + Math.sin(time * 2) * 0.2;
            }
        });
    }
}

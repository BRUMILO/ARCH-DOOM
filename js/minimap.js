export class Minimap {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Minimap canvas not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.size = 220;
        this.canvas.width = this.size;
        this.canvas.height = this.size;

        // Scale: pixels per game unit
        this.scale = 8;

        // Offset to center the map
        this.offsetX = 0;
        this.offsetY = 0;

        // Colors (arcade theme)
        this.wallColor = '#00ffff';
        this.playerColor = '#ffff00';
        this.triggerActiveColor = '#ff00ff';
        this.triggerInactiveColor = '#444444';
        this.backgroundColor = 'rgba(10, 10, 20, 0.95)';
    }

    update(playerPos, playerRotation, level, enemies = []) {
        if (!this.ctx) return;

        // Calculate center offset based on player position
        this.offsetX = this.size / 2 - playerPos.x * this.scale;
        this.offsetY = this.size / 2 - playerPos.z * this.scale;

        // Clear canvas
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.size, this.size);

        // Draw grid background
        this.drawGrid();

        // Draw walls
        this.drawWalls(level.walls);

        // Draw triggers (questions)
        this.drawTriggers(level.questions);

        // Draw enemies
        this.drawEnemies(enemies);

        // Draw player (always centered)
        this.drawPlayer(playerPos, playerRotation);
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        const gridSize = this.scale * 5;

        for (let x = 0; x < this.size; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.size);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.size; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.size, y);
            this.ctx.stroke();
        }
    }

    drawWalls(walls) {
        this.ctx.fillStyle = this.wallColor;
        this.ctx.strokeStyle = this.wallColor;
        this.ctx.lineWidth = 2;

        walls.forEach(wall => {
            const x = wall.position.x * this.scale + this.offsetX;
            const y = wall.position.z * this.scale + this.offsetY;

            if (x > -20 && x < this.size + 20 && y > -20 && y < this.size + 20) {
                const size = (wall.scale.x > wall.scale.z ? wall.scale.x : wall.scale.z) * this.scale;
                const width = wall.scale.x * this.scale;
                const height = wall.scale.z * this.scale;

                this.ctx.fillRect(
                    x - width / 2,
                    y - height / 2,
                    width,
                    height
                );
            }
        });
    }

    drawTriggers(questions) {
        questions.forEach(trigger => {
            const x = trigger.position.x * this.scale + this.offsetX;
            const y = trigger.position.z * this.scale + this.offsetY;

            if (x > -10 && x < this.size + 10 && y > -10 && y < this.size + 10) {
                const isActive = trigger.userData.active;

                this.ctx.fillStyle = isActive ? this.triggerActiveColor : this.triggerInactiveColor;
                this.ctx.strokeStyle = isActive ? this.triggerActiveColor : this.triggerInactiveColor;
                this.ctx.lineWidth = 2;

                const radius = isActive ? 4 : 2;

                this.ctx.beginPath();
                this.ctx.arc(x, y, radius, 0, Math.PI * 2);
                this.ctx.fill();

                if (isActive) {
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            }
        });
    }

    drawPlayer(pos, rotationAngle) {
        const x = this.size / 2;
        const y = this.size / 2;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(-rotationAngle + Math.PI);

        const gradient = this.ctx.createRadialGradient(0, 0, 5, 0, 0, 80);
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.arc(0, 0, 80, -Math.PI / 2 - Math.PI / 6, -Math.PI / 2 + Math.PI / 6);
        this.ctx.lineTo(0, 0);
        this.ctx.fill();
        const pulse = 1 + Math.sin(performance.now() / 200) * 0.2;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3 * pulse, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = this.playerColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -12);
        this.ctx.lineTo(-5, -2);
        this.ctx.lineTo(0, -4);
        this.ctx.lineTo(5, -2);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    drawEnemies(enemies) {
        enemies.forEach(enemy => {
            if (enemy.isDead()) return;

            const x = enemy.mesh.position.x * this.scale + this.offsetX;
            const y = enemy.mesh.position.z * this.scale + this.offsetY;

            if (x > -10 && x < this.size + 10 && y > -10 && y < this.size + 10) {
                this.ctx.fillStyle = '#ff0000';
                this.ctx.strokeStyle = '#ff0000';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 5, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = '#ff0000';
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        });
    }
}

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

        this.scale = 8;

        this.offsetX = 0;
        this.offsetY = 0;

        this.wallColor = '#00ffff';
        this.playerColor = '#ff00ff';
        this.triggerActiveColor = '#00ffff';
        this.triggerInactiveColor = '#444444';
        this.backgroundColor = 'rgba(10, 10, 20, 0.95)';

        this.levelColors = {
            1: '#00ffff',
            2: '#ff00ff',
            3: '#00ff00'
        };
        this.backgroundColor = 'rgba(10, 10, 20, 0.95)';
        this.lastLevelIndex = -1;
    }


    update(playerPos, playerRotation, level, enemies = []) {
        if (!this.ctx) return;

        // Calculate center offset based on player position
        this.offsetX = this.size / 2 - playerPos.x * this.scale;
        this.offsetY = this.size / 2 - playerPos.z * this.scale;

        // Update colors based on level
        const themeColor = this.levelColors[level.currentLevelIndex] || '#00ffff';
        this.wallColor = themeColor;
        this.triggerActiveColor = themeColor;

        // Update DOM border/shadow if level changed
        if (this.lastLevelIndex !== level.currentLevelIndex) {
            this.lastLevelIndex = level.currentLevelIndex;
            this.canvas.style.borderColor = themeColor;
            this.canvas.style.boxShadow = `0 0 30px ${themeColor}cc, inset 0 0 30px ${themeColor}26`;
        }

        // Clear canvas
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.size, this.size);

        // Draw grid background
        this.drawGrid(themeColor);

        // Draw walls
        // Pass the level object to access maps and cell size
        this.drawWalls(level, themeColor);

        // Draw triggers (questions)
        this.drawTriggers(level.questions);

        // Draw enemies
        this.drawEnemies(enemies);

        // Draw player (always centered)
        this.drawPlayer(playerPos, playerRotation, themeColor);
    }

    drawGrid(themeColor = '#00ffff') {
        this.ctx.strokeStyle = themeColor;
        this.ctx.globalAlpha = 0.1;
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
        this.ctx.globalAlpha = 1.0;
    }

    drawWalls(level, color = '#00ffff') {
        const map = level.maps[level.currentLevelIndex];
        if (!map) return;

        const cellSize = level.cellSize || 4;
        const scaledSize = cellSize * this.scale;

        this.ctx.fillStyle = '#000000';
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;

        for (let row = 0; row < map.length; row++) {
            for (let col = 0; col < map[row].length; col++) {
                if (map[row][col] === 1) {

                    const wx = col * cellSize - 20;
                    const wz = row * cellSize - 20;
                    const centerX = wx * this.scale + this.offsetX;
                    const centerY = wz * this.scale + this.offsetY;

                    const x = centerX - scaledSize / 2;
                    const y = centerY - scaledSize / 2;

                    this.ctx.fillRect(x, y, scaledSize, scaledSize);

                    this.ctx.beginPath();

                    if (row === 0 || map[row - 1][col] !== 1) {
                        this.ctx.moveTo(x, y);
                        this.ctx.lineTo(x + scaledSize, y);
                    }
                    if (row === map.length - 1 || map[row + 1][col] !== 1) {
                        this.ctx.moveTo(x, y + scaledSize);
                        this.ctx.lineTo(x + scaledSize, y + scaledSize);
                    }

                    if (col === 0 || map[row][col - 1] !== 1) {
                        this.ctx.moveTo(x, y);
                        this.ctx.lineTo(x, y + scaledSize);
                    }

                    if (col === map[row].length - 1 || map[row][col + 1] !== 1) {
                        this.ctx.moveTo(x + scaledSize, y);
                        this.ctx.lineTo(x + scaledSize, y + scaledSize);
                    }

                    this.ctx.stroke();
                }
            }
        }
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

    drawPlayer(pos, rotationAngle, color = '#00ffff') {
        const x = this.size / 2;
        const y = this.size / 2;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(-rotationAngle + Math.PI);

        // Dynamic View Cone Gradient
        const gradient = this.ctx.createRadialGradient(0, 0, 5, 0, 0, 80);
        gradient.addColorStop(0, `${color}40`);

        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '00');

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

        // Arrow indicator color matches theme
        this.ctx.fillStyle = color;
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

import { questions } from './data.js';

export class QuizManager {
    constructor(playerControls, player, soundManager, onLevelComplete) {
        this.playerControls = playerControls;
        this.player = player;
        this.soundManager = soundManager;
        this.onLevelComplete = onLevelComplete;

        this.overlay = document.getElementById('quiz-overlay');
        this.questionEl = document.getElementById('quiz-question');
        this.optionsEl = document.getElementById('quiz-options');
        this.feedbackEl = document.getElementById('quiz-feedback');

        this.activeTrigger = null;
        this.currentLevel = 1;
        this.correctAnswersInLevel = 0;
        this.totalRequired = 10;
    }

    triggerQuiz(triggerObject, levelIndex) {
        this.activeTrigger = triggerObject;
        this.currentLevel = levelIndex;
        this.showQuiz(levelIndex);
        this.playerControls.unlock();
    }

    showQuiz(level) {
        this.overlay.style.display = 'flex';
        this.feedbackEl.textContent = '';
        this.feedbackEl.style.color = '#fff';

        const levelQuestions = questions.filter(q => q.level === level);
        if (levelQuestions.length === 0) {
            console.error("No questions for level " + level);
            this.closeQuiz(true);
            return;
        }

        const qData = levelQuestions[Math.floor(Math.random() * levelQuestions.length)];

        this.questionEl.textContent = qData.question;
        this.optionsEl.innerHTML = '';

        qData.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = opt;
            btn.onclick = () => this.checkAnswer(index, qData.answer);
            this.optionsEl.appendChild(btn);
        });
    }

    checkAnswer(selectedIndex, correctIndex) {
        if (selectedIndex === correctIndex) {
            this.feedbackEl.textContent = "✓ CORRECT! +50 HEALTH";
            this.feedbackEl.style.color = "#0f0";
            this.correctAnswersInLevel++;

            // Play Sound
            if (this.soundManager) this.soundManager.play('correct');

            // Heal player
            if (this.player) {
                this.player.heal(50);
            }

            setTimeout(() => {
                this.closeQuiz(true);
            }, 1000);
        } else {
            this.feedbackEl.textContent = "✗ INCORRECT! -25 HEALTH";
            this.feedbackEl.style.color = "#f00";

            // Play Sound
            if (this.soundManager) this.soundManager.play('wrong');

            // Damage player
            if (this.player) {
                this.player.takeDamage(25);
            }

            setTimeout(() => {
                this.closeQuiz(false);
            }, 1000);
        }
    }

    closeQuiz(success) {
        this.overlay.style.display = 'none';
        this.playerControls.lock();

        if (success && this.activeTrigger) {
            this.activeTrigger.userData.active = false;
            this.activeTrigger.visible = false;

            // Check Level Progress
            if (this.correctAnswersInLevel >= this.totalRequired) {
                this.onLevelComplete();
                this.correctAnswersInLevel = 0;
            }
        }
    }

    // Reset counter and set new requirement
    resetLevel(requiredCount) {
        this.correctAnswersInLevel = 0;
        this.totalRequired = requiredCount || 10;
        console.log("Level reset. Required: " + this.totalRequired);
    }
}

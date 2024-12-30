// game.js
import { diceConfig } from './config.js';
import AudioManager from './audioManager.js';

class Game {
    constructor() {
        this.foundPatterns = new Set();
        this.isRolling = false;
        this.audioManager = new AudioManager();

        // Add cleanup handler
        window.addEventListener('beforeunload', () => {
            if (this.audioManager) {
                this.audioManager.cleanup();
            }
        });
    }

    generateAllCombinations() {
        const combinations = [];
        diceConfig.dice1.faces.forEach(color => {
            diceConfig.dice2.faces.forEach(pattern => {
                diceConfig.dice3.faces.forEach(decoration => {
                    combinations.push(`${color} ${pattern} ${decoration}`);
                });
            });
        });
        return combinations.sort();
    }

    updateStats() {
        const foundCount = document.getElementById('foundCount');
        const totalCount = document.getElementById('totalCount');
        const total = this.generateAllCombinations().length;
        
        foundCount.textContent = this.foundPatterns.size;
        totalCount.textContent = total;
    }

    updatePatternsList() {
        const patternsList = document.getElementById('patternsList');
        patternsList.innerHTML = '';
        
        const allPatterns = this.generateAllCombinations();
        
        allPatterns.forEach(pattern => {
            const div = document.createElement('div');
            div.className = `pattern-item ${this.foundPatterns.has(pattern) ? 'found' : ''}`;
            div.innerHTML = `<input type="checkbox" ${this.foundPatterns.has(pattern) ? 'checked' : ''} disabled> ${pattern}`;
            patternsList.appendChild(div);
        });

        this.updateStats();
    }

    updateDieDisplay(dieId, value, type) {
        const die = document.getElementById(dieId);
        if (!die) {
            console.error(`Die with id ${dieId} not found`);
            return;
        }
        
        // Remove all previous data attributes
        die.removeAttribute('data-color');
        die.removeAttribute('data-pattern');
        die.removeAttribute('data-decoration');
        
        // Add new data attribute based on type
        die.setAttribute(`data-${type.toLowerCase()}`, value);
        
        // Update the label
        const label = die.querySelector('.die-label');
        if (label) {
            label.textContent = value;
        }
    }

    setupAudioToggle() {
        const toggleButton = document.getElementById('audioToggle');
        
        toggleButton.addEventListener('click', () => {
            const isEnabled = this.audioManager.toggle();
            toggleButton.textContent = isEnabled ? '🔊' : '🔇';
            toggleButton.classList.toggle('muted');
        });
    }

    async rollDice() {
        if (this.isRolling) return;
        this.isRolling = true;

        const rollButton = document.getElementById('rollButton');
        rollButton.disabled = true;

        const dice = document.querySelectorAll('.die');
        dice.forEach(die => {
            die.classList.add('rolling');
            die.querySelector('.die-circle').style.opacity = '0.5';
        });

        // Get all possible combinations that haven't been found yet
        const allPossibleCombinations = [];
        diceConfig.dice1.faces.forEach(color => {
            diceConfig.dice2.faces.forEach(pattern => {
                diceConfig.dice3.faces.forEach(decoration => {
                    const combination = `${color} ${pattern} ${decoration}`;
                    if (!this.foundPatterns.has(combination)) {
                        allPossibleCombinations.push({color, pattern, decoration});
                    }
                });
            });
        });

        // Check if all patterns have been found
        if (allPossibleCombinations.length === 0) {
            alert("Congratulations! You've found all possible patterns!");
            rollButton.disabled = true;
            this.isRolling = false;
            return;
        }

        // Randomly select from remaining combinations
        const randomIndex = Math.floor(Math.random() * allPossibleCombinations.length);
        const selectedCombination = allPossibleCombinations[randomIndex];

        // Play dice roll sound and wait for it to finish
        await this.audioManager.playDiceRoll();

        // Update dice display after roll
        dice.forEach(die => {
            die.classList.remove('rolling');
            die.querySelector('.die-circle').style.opacity = '1';
        });
        
        this.updateDieDisplay('die1', selectedCombination.color, 'color');
        this.updateDieDisplay('die2', selectedCombination.pattern, 'pattern');
        this.updateDieDisplay('die3', selectedCombination.decoration, 'decoration');

        diceConfig.dice1.currentValue = selectedCombination.color;
        diceConfig.dice2.currentValue = selectedCombination.pattern;
        diceConfig.dice3.currentValue = selectedCombination.decoration;

        const combination = `${selectedCombination.color} ${selectedCombination.pattern} ${selectedCombination.decoration}`;
        this.foundPatterns.add(combination);
        this.updatePatternsList();

        // Play the pattern sequence after the roll
        this.audioManager.playSequence(
            selectedCombination.color,
            selectedCombination.pattern,
            selectedCombination.decoration
        );

        rollButton.disabled = false;
        this.isRolling = false;
    }

    initializeDice() {
        this.updateDieDisplay('die1', diceConfig.dice1.default, 'color');
        this.updateDieDisplay('die2', diceConfig.dice2.default, 'pattern');
        this.updateDieDisplay('die3', diceConfig.dice3.default, 'decoration');

        diceConfig.dice1.currentValue = diceConfig.dice1.default;
        diceConfig.dice2.currentValue = diceConfig.dice2.default;
        diceConfig.dice3.currentValue = diceConfig.dice3.default;

        const rollButton = document.getElementById('rollButton');
        rollButton.addEventListener('click', () => this.rollDice());

        this.updatePatternsList();
    }

    initialize() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeDice();
            this.setupAudioToggle();
        });
    }
}

// Create and initialize the game
const game = new Game();
game.initialize();

export default game;

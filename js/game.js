// game.js
import { diceConfig } from './config.js'; // Add this import at the top
import AudioManager from './audioManager.js';

let foundPatterns = new Set();
let isRolling = false;
const audioManager = new AudioManager();

function generateAllCombinations() {
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

function updateStats() {
    const foundCount = document.getElementById('foundCount');
    const totalCount = document.getElementById('totalCount');
    const total = generateAllCombinations().length;
    
    foundCount.textContent = foundPatterns.size;
    totalCount.textContent = total;
}

function updatePatternsList() {
    const patternsList = document.getElementById('patternsList');
    patternsList.innerHTML = '';
    
    const allPatterns = generateAllCombinations();
    
    allPatterns.forEach(pattern => {
        const div = document.createElement('div');
        div.className = `pattern-item ${foundPatterns.has(pattern) ? 'found' : ''}`;
        div.innerHTML = `<input type="checkbox" ${foundPatterns.has(pattern) ? 'checked' : ''} disabled> ${pattern}`;
        patternsList.appendChild(div);
    });

    updateStats();
}

function updateDieDisplay(dieId, value, type) {
    const die = document.getElementById(dieId);
    const dieWrapper = die.closest('.die');
    const textSpan = die.querySelector('.die-label');
    textSpan.textContent = value;
    
    // Remove all previous data attributes
    die.removeAttribute('data-color');
    die.removeAttribute('data-pattern');
    die.removeAttribute('data-decoration');
    
    // Add new data attribute based on type
    die.setAttribute(`data-${type}`, value);
}

function setupAudioToggle() {
    const toggleButton = document.getElementById('audioToggle');
    
    toggleButton.addEventListener('click', () => {
        const isEnabled = audioManager.toggle();
        toggleButton.textContent = isEnabled ? '🔊' : '🔇';
        toggleButton.classList.toggle('muted');
    });
}

function rollDice() {
    if (isRolling) return;
    isRolling = true;

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
                if (!foundPatterns.has(combination)) {
                    allPossibleCombinations.push({color, pattern, decoration});
                }
            });
        });
    });

    // Check if all patterns have been found
    if (allPossibleCombinations.length === 0) {
        alert("Congratulations! You've found all possible patterns!");
        rollButton.disabled = true;
        isRolling = false;
        return;
    }

    // Randomly select from remaining combinations
    const randomIndex = Math.floor(Math.random() * allPossibleCombinations.length);
    const selectedCombination = allPossibleCombinations[randomIndex];

    // Multiple rotation animation
    let rotations = 2;
    let currentRotation = 0;
    
    function rotate() {
        if (currentRotation < rotations) {
            currentRotation++;
            setTimeout(rotate, 800); // Match this with CSS animation duration
        } else {
            // Final update after rotations complete
            dice.forEach(die => {
                die.classList.remove('rolling');
                die.querySelector('.die-circle').style.opacity = '1';
            });
            
            updateDieDisplay('die1', selectedCombination.color, 'color');
            updateDieDisplay('die2', selectedCombination.pattern, 'pattern');
            updateDieDisplay('die3', selectedCombination.decoration, 'decoration');

            diceConfig.dice1.currentValue = selectedCombination.color;
            diceConfig.dice2.currentValue = selectedCombination.pattern;
            diceConfig.dice3.currentValue = selectedCombination.decoration;

            const combination = `${selectedCombination.color} ${selectedCombination.pattern} ${selectedCombination.decoration}`;
            foundPatterns.add(combination);
            updatePatternsList();

            // Play the audio sequence
            audioManager.playSequence(
                selectedCombination.color,
                selectedCombination.pattern,
                selectedCombination.decoration
            );

            rollButton.disabled = false;
            isRolling = false;
        }
    }

    rotate(); // Start the rotation sequence
}

function initializeDice() {
    // Set initial values
    updateDieDisplay('die1', diceConfig.dice1.default, 'color');
    updateDieDisplay('die2', diceConfig.dice2.default, 'pattern');
    updateDieDisplay('die3', diceConfig.dice3.default, 'decoration');

    diceConfig.dice1.currentValue = diceConfig.dice1.default;
    diceConfig.dice2.currentValue = diceConfig.dice2.default;
    diceConfig.dice3.currentValue = diceConfig.dice3.default;

    // Add click event listener to roll button
    const rollButton = document.getElementById('rollButton');
    rollButton.addEventListener('click', rollDice);

    // Initialize patterns list and stats
    updatePatternsList();
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeDice();
    setupAudioToggle();
});
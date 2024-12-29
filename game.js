// game.js
let foundPatterns = new Set();
let isRolling = false;

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
    const label = die.querySelector('.die-label');
    label.textContent = value;
    
    // Remove all previous data attributes
    die.removeAttribute('data-color');
    die.removeAttribute('data-pattern');
    die.removeAttribute('data-decoration');
    
    // Add new data attribute based on type
    die.setAttribute(`data-${type}`, value);
}

function rollDice() {
    if (isRolling) return;
    isRolling = true;

    const rollButton = document.getElementById('rollButton');
    rollButton.disabled = true;

    const dice = document.querySelectorAll('.die');
    dice.forEach(die => {
        die.classList.add('rolling');
        // Hide current content during roll
        die.querySelector('.die-circle').style.opacity = '0.5';
    });

    // Generate new values
    const color = diceConfig.dice1.faces[Math.floor(Math.random() * diceConfig.dice1.faces.length)];
    const pattern = diceConfig.dice2.faces[Math.floor(Math.random() * diceConfig.dice2.faces.length)];
    const decoration = diceConfig.dice3.faces[Math.floor(Math.random() * diceConfig.dice3.faces.length)];

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
            
            updateDieDisplay('die1', color, 'color');
            updateDieDisplay('die2', pattern, 'pattern');
            updateDieDisplay('die3', decoration, 'decoration');

            diceConfig.dice1.currentValue = color;
            diceConfig.dice2.currentValue = pattern;
            diceConfig.dice3.currentValue = decoration;

            const combination = `${color} ${pattern} ${decoration}`;
            foundPatterns.add(combination);
            updatePatternsList();

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

function createSnowflakes() {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.textContent = '❄';
    snowflake.style.left = Math.random() * 100 + 'vw';
    snowflake.style.animationDuration = Math.random() * 3 + 2 + 's';
    document.body.appendChild(snowflake);

    snowflake.addEventListener('animationend', () => snowflake.remove());
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeDice();
    setInterval(createSnowflakes, 500);
});

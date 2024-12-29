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
    const textSpan = die.querySelector('.die-text');
    textSpan.textContent = value;
    
    // Remove all previous data attributes
    die.removeAttribute('data-color');
    die.removeAttribute('data-pattern');
    die.removeAttribute('data-decoration');
    
    // Add new data attribute based on type
    die.setAttribute(`data-${type}`, value);

    // Ensure pattern overlay exists for pattern die
    if (type === 'pattern' && !die.querySelector('.pattern-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'pattern-overlay';
        die.appendChild(overlay);
    }
}

function rollDice() {
    if (isRolling) return;
    isRolling = true;

    const rollButton = document.getElementById('rollButton');
    rollButton.disabled = true;

    const dice = document.querySelectorAll('.die');
    dice.forEach(die => die.classList.add('rolling'));

    const color = diceConfig.dice1.faces[Math.floor(Math.random() * diceConfig.dice1.faces.length)];
    const pattern = diceConfig.dice2.faces[Math.floor(Math.random() * diceConfig.dice2.faces.length)];
    const decoration = diceConfig.dice3.faces[Math.floor(Math.random() * diceConfig.dice3.faces.length)];

    setTimeout(() => {
        // Update dice displays with visual representations
        updateDieDisplay('die1', color, 'color');
        updateDieDisplay('die2', pattern, 'pattern');
        updateDieDisplay('die3', decoration, 'decoration');

        dice.forEach(die => die.classList.remove('rolling'));

        diceConfig.dice1.currentValue = color;
        diceConfig.dice2.currentValue = pattern;
        diceConfig.dice3.currentValue = decoration;

        const combination = `${color} ${pattern} ${decoration}`;
        foundPatterns.add(combination);
        updatePatternsList();

        rollButton.disabled = false;
        isRolling = false;
    }, 500);
}

function initializeDice() {
    // Set initial values with visual representations
    updateDieDisplay('die1', diceConfig.dice1.default, 'color');
    updateDieDisplay('die2', diceConfig.dice2.default, 'pattern');
    updateDieDisplay('die3', diceConfig.dice3.default, 'decoration');

    diceConfig.dice1.currentValue = diceConfig.dice1.default;
    diceConfig.dice2.currentValue = diceConfig.dice2.default;
    diceConfig.dice3.currentValue = diceConfig.dice3.default;

    const rollButton = document.getElementById('rollButton');
    rollButton.addEventListener('click', rollDice);

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

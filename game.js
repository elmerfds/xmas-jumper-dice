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

function rollDice() {
    if (isRolling) return;
    isRolling = true;

    // Disable roll button during animation
    const rollButton = document.getElementById('rollButton');
    rollButton.disabled = true;

    // Add rolling animation class to dice
    const dice = document.querySelectorAll('.die');
    dice.forEach(die => die.classList.add('rolling'));

    // Generate new values
    const color = diceConfig.dice1.faces[Math.floor(Math.random() * diceConfig.dice1.faces.length)];
    const pattern = diceConfig.dice2.faces[Math.floor(Math.random() * diceConfig.dice2.faces.length)];
    const decoration = diceConfig.dice3.faces[Math.floor(Math.random() * diceConfig.dice3.faces.length)];

    // Update dice after animation
    setTimeout(() => {
        // Update dice values
        document.getElementById('die1').textContent = color;
        document.getElementById('die2').textContent = pattern;
        document.getElementById('die3').textContent = decoration;

        // Remove rolling animation
        dice.forEach(die => die.classList.remove('rolling'));

        // Update current values in config
        diceConfig.dice1.currentValue = color;
        diceConfig.dice2.currentValue = pattern;
        diceConfig.dice3.currentValue = decoration;

        // Add to found patterns
        const combination = `${color} ${pattern} ${decoration}`;
        foundPatterns.add(combination);

        // Update UI
        updatePatternsList();

        // Re-enable roll button
        rollButton.disabled = false;
        isRolling = false;
    }, 500);
}

function initializeDice() {
    // Set initial values
    document.getElementById('die1').textContent = diceConfig.dice1.default;
    document.getElementById('die2').textContent = diceConfig.dice2.default;
    document.getElementById('die3').textContent = diceConfig.dice3.default;

    // Initialize current values
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

    // Remove snowflake after animation
    snowflake.addEventListener('animationend', () => snowflake.remove());
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeDice();
    setInterval(createSnowflakes, 500);
});

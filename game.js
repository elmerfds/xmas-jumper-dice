// game.js
let foundPatterns = new Set();

function generateAllCombinations() {
    const combinations = [];
    diceConfig.dice1.faces.forEach(color => {
        diceConfig.dice2.faces.forEach(pattern => {
            diceConfig.dice3.faces.forEach(decoration => {
                combinations.push(`${color} ${pattern} ${decoration}`);
            });
        });
    });
    return combinations;
}

function updatePatternsList() {
    const patternsList = document.getElementById('patternsList');
    patternsList.innerHTML = '';
    
    const allPatterns = generateAllCombinations();
    allPatterns.sort(); // Sort patterns alphabetically
    
    allPatterns.forEach(pattern => {
        const div = document.createElement('div');
        div.className = `pattern-item ${foundPatterns.has(pattern) ? 'found' : ''}`;
        div.innerHTML = `<input type="checkbox" ${foundPatterns.has(pattern) ? 'checked' : ''} disabled> ${pattern}`;
        patternsList.appendChild(div);
    });
}

function rollDice() {
    // Add rolling animation class
    const dice = document.querySelectorAll('.die');
    dice.forEach(die => {
        die.style.transform = `rotate(${Math.random() * 360}deg)`;
    });

    // Generate new values
    const color = diceConfig.dice1.faces[Math.floor(Math.random() * diceConfig.dice1.faces.length)];
    const pattern = diceConfig.dice2.faces[Math.floor(Math.random() * diceConfig.dice2.faces.length)];
    const decoration = diceConfig.dice3.faces[Math.floor(Math.random() * diceConfig.dice3.faces.length)];

    // Update dice display
    setTimeout(() => {
        document.getElementById('die1').textContent = color;
        document.getElementById('die2').textContent = pattern;
        document.getElementById('die3').textContent = decoration;
        
        // Reset transform
        dice.forEach(die => {
            die.style.transform = 'none';
        });

        // Update patterns
        const combination = `${color} ${pattern} ${decoration}`;
        foundPatterns.add(combination);
        updatePatternsList();
    }, 500);
}

function initializeDice() {
    // Set initial values
    document.getElementById('die1').textContent = diceConfig.dice1.default;
    document.getElementById('die2').textContent = diceConfig.dice2.default;
    document.getElementById('die3').textContent = diceConfig.dice3.default;
    
    // Add click event listener to roll button
    const rollButton = document.getElementById('rollButton');
    rollButton.addEventListener('click', rollDice);
    
    // Initialize patterns list
    updatePatternsList();
}

// Create snowflake animation
function createSnowflakes() {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.textContent = '❄';
    snowflake.style.left = Math.random() * 100 + 'vw';
    snowflake.style.animationDuration = Math.random() * 3 + 2 + 's';
    document.body.appendChild(snowflake);

    snowflake.addEventListener('animationend', () => snowflake.remove());
}

// Start the game
document.addEventListener('DOMContentLoaded', () => {
    initializeDice();
    setInterval(createSnowflakes, 500);
});

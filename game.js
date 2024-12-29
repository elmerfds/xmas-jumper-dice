// game.js
let foundPatterns = new Set();

function generateAllCombinations() {
    const combinations = [];
    diceConfig.dice1.faces.forEach(color => {
        diceConfig.dice2.faces.forEach(pattern => {
            diceConfig.dice3.faces.forEach(decoration => {
                combinations.push

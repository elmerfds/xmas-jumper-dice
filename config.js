// config.js
const diceConfig = {
    dice1: {
        name: 'Color',
        faces: ['Red', 'Green', 'White', 'Blue', 'Gold'],
        default: 'Red',
        currentValue: null
    },
    dice2: {
        name: 'Pattern', 
        faces: ['Striped', 'Spotty', 'Zigzag', 'Plain', 'Checkered'],
        default: 'Plain',
        currentValue: null
    },
    dice3: {
        name: 'Decoration',
        faces: ['Snowman', 'Reindeer', 'Tree', 'Star', 'Bell'],
        default: 'Tree',
        currentValue: null
    }
};

const defaultConfigs = {
    preset1: {
        dice1: 'Red',
        dice2: 'Plain',
        dice3: 'Tree'
    },
    preset2: {
        dice1: 'Green',
        dice2: 'Spotty',
        dice3: 'Snowman'
    }
};

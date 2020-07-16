const tigma = require("../dist/tigma.js");

const engine = tigma.Tigma({});

engine.init({});

const parsed = engine.parse('identifier:deneme');

console.log('Engine created: ' + JSON.stringify(parsed));

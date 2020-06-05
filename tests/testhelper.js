const path = require('path');

const {EXIT_SUCCESS, main_test_fn} = require('../run');

const filePath = (inPath) => path.resolve(__dirname, inPath)
const dataFile = (inPath) => path.resolve(filePath('data'), inPath)

const covExec = (args) => {
    let retVal = undefined;

    const oldConsole = global.console;
    let buffer = [];
    let retCode = EXIT_SUCCESS;
    const falseConsole = {
        log: (x) => {
            buffer.push(x);
        }
    };

    try {
        retVal = main_test_fn([...args], {exit: (x) => retCode = x}, falseConsole);
    } finally {
        global.console = oldConsole;
    }

    return {retVal, buffer:buffer.join("\n"), code: retCode};
}

module.exports = { exec: covExec, filePath, dataFile };


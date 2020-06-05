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

// Other attempts at execution.
//const vm = require('vm');
//const fs = require('fs');
//
// const workingRoot = path.resolve(__dirname, '..');
// const pkginfo = require(path.resolve(workingRoot, 'package.json'));
// const scriptPath = path.resolve(workingRoot, pkginfo.main);
//
// const script = new vm.Script(
//     fs.readFileSync(scriptPath, 'utf-8').replace(/^#!\//, '//#!/'),
//     {
//         filename: pkginfo.main,
//         lineOffset: 1,
//         columnOffset: 1,
//         displayErrors: false,
//         timeout: 1000});
// const spawnExec = function _spawnExec(args) {
//     return new Promise(resolve => {
//         cp_exec(`${process.execPath} ${scriptPath} ${args.join(' ')}`,
//             {workingRoot},
//             (error, stdout, stderr) => {
//                 resolve({
//                     code: error && error.code ? error.code : 0,
//                     error,
//                     stdout,
//                     stderr
//                 })
//             })
//     });
// }
//
//
// const cp_exec = require('child_process').exec;
// const NODE_PATH = process.execPath
// const vmExec = function _vmExec(args) {
//     const buffer = [];
//
//     const falseConsole = {
//         log: (x) => {
//             buffer.push(x);
//             console.log("PROXIED => ", x);
//         }
//     };
//
//     let exitCode = 0;
//
//     const dbg = () => {
//         debugger
//     };
//
//     const proc = {
//         ...process,
//         argv: [NODE_PATH, scriptPath, ...args],
//         argv0: NODE_PATH,
//         execArgv: [],
//         exit: (code) => exitCode = code
//     };
//
//     const context = vm.createContext({
//         require: (x) => {
//             if (x === 'assert') return;
//             process = proc;
//             debug = dbg;
//             try {
//                 return require(x);
//             } catch (ex) {
//                 dbg();
//             }
//         },
//         __dirname: path.resolve(workingRoot),
//         __filename: scriptPath,
//         console: falseConsole,
//         process: proc,
//         module: {exports: {}},
//         assert: {ok: () => {}}
//     });
//
//
//     script.runInContext(context);
// }

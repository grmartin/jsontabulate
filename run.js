#!/usr/bin/env node
const fs = require('fs');
const jsonpath = require('jsonpath');
const loZip = require('lodash.zip');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const Table = require('easy-table');

/* External Constants */
const EXIT_SUCCESS = 0;
const EXIT_BAD_ARGS = 1;
const EXIT_BAD_DATA = 100;

/* Internal Constants */
const STDIN_SYM = Symbol("STDIN");
const NO_VALUE = Symbol("N/A");
const headerExpression = /^([A-z0-9_\-]*?):(.*)$/;
const NO_HEADER = Symbol("NO_HEADER");

const optionDefinitions = [
    {name: 'format', alias: "f", type: String, defaultValue: "table"},
    {name: 'in', alias: "i", type: String, defaultValue: STDIN_SYM},
    {name: 'base', alias: "b", type: String, defaultValue: '$'},
    {name: 'config', alias: "c", type: String, defaultValue: NO_VALUE},
    {name: 'expression', type: String, defaultOption: true, multiple: true}
];

const usageDefinition = [
    {
        header: "Description:",
        content: "Parse input (STDIN) JSON data and output a tabulated table or simplified JSON document with the " +
            "results.",
    },
    {header: "Arguments:", optionList: optionDefinitions},
    {
        header: "Status Codes:",
        content: [
            {name: 'EXIT_SUCCESS: ' + EXIT_SUCCESS, summary: 'The application exited with a successful result.'},
            {name: 'EXIT_BAD_ARGS: ' + EXIT_BAD_ARGS, summary: 'Bad arguments were provided to the application.'},
            {name: 'EXIT_BAD_DATA: ' + EXIT_BAD_DATA, summary: 'Bad input data was provided.'}
        ]
    }
];

let options = commandLineArgs(optionDefinitions);

if (options.config !== NO_VALUE) {
    options = {...options, ...JSON.parse(fs.readFileSync(options.config, 'utf8'))};
    options.in = options.in === undefined ? STDIN_SYM : options.in;
}

if ((options.expression || []).length < 1) {
    console.error(commandLineUsage(usageDefinition));
    process.exit(EXIT_BAD_ARGS);
}

let data = JSON.parse(fs.readFileSync(options.in === STDIN_SYM ? '/dev/stdin' : options.in).toString());

if (options.base !== '$') {
    data = jsonpath.query(data, options.base);
}

const isEmpty = (x) => x === null || x === undefined || x.trim().length === 0;
const resultLists = [];
let headers = [];

const expressions = (options.expression || []).map((expr) => {
    if (headerExpression.test(expr)) {
        const parts = headerExpression.exec(expr);
        headers.push(parts[1]);
        return parts[2];
    } else {
        headers.push(NO_HEADER);
        return expr;
    }
});

expressions.forEach((expression) => {
    resultLists.push(jsonpath.query(data, expression));
});

const output = headers.filter((x) => x !== NO_HEADER).length === 0 ?
    loZip(...resultLists) :
    [
        headers.map((x, i) => x === NO_HEADER || isEmpty(x) ? `MISSING_${i}` : x),
        ...loZip(...resultLists)
    ];

const csvEscape = (string) => {
    const regex = /[" '\n\r\t,]/img;

    if (regex.test(string)) {
        let out = string.replace(/(")/img, '\"');
        const repls = [
            [/\\/g, "\\\\"],
            [/\r/g, "\\r"],
            [/\t/g, "\\t"],
            [/\n/g, "\\n"]
        ].forEach((set) => {
            out = out.replace(set[0], set[1]);
        });

        return `"${out}"`;
    }

    return string;
}

switch (options.format) {
    case "json":
        console.log(JSON.stringify(output));
        break;
    case "json_pretty":
        console.log(JSON.stringify(output, undefined, "  "));
        break;
    case "csv":
        console.log(output.map((x) => x.map(csvEscape)).join("\n"));
        break;
    case "table":
        let table = new Table();
        table.separator = ' | ';
        output.forEach(function (row, row_idx) {
            if (row_idx === 0) return; // skip headers
            row.forEach((cell, cell_idx) => {
                table.cell(headers[cell_idx], cell);
            })
            table.newRow();
        })

        console.log(table.toString());
        break;
}

const {describe, expect, it} = require("@jest/globals");

const {NO_HEADER, EXIT_SUCCESS, tabulate, main_test_fn} = require('../run');
const fs = require('fs');
const {dataFile, exec} = require("./testhelper");

const dataPath = dataFile('books.json');
const data = fs.readFileSync(dataPath, 'utf-8');
const baseData = () => JSON.parse(data);

// This file contains data-only tests

describe('Should Process Books Example', () => {
    describe("fn tabulate(...)", () => {

        const fullStoreString = [
            ["Title"],
            [JSON.stringify({
                "book": [
                    {"category": "reference", "author": "Nigel Rees", "title": "Sayings of the Century", "price": 8.95},
                    {"category": "fiction", "author": "Evelyn Waugh", "title": "Sword of Honour", "price": 12.99},
                    {
                        "category": "fiction",
                        "author": "Herman Melville",
                        "title": "Moby Dick",
                        "isbn": "0-553-21311-3",
                        "price": 8.99
                    },
                    {
                        "category": "fiction",
                        "author": "J. R. R. Tolkien",
                        "title": "The Lord of the Rings",
                        "isbn": "0-395-19395-8",
                        "price": 22.99
                    }
                ],
                "bicycle": {"color": "red", "price": 19.95}
            })]
        ];

        const titleAuthorResult = (header2 = "Author") => ([
            ["Title", header2],
            ["Sayings of the Century", "Nigel Rees"],
            ["Sword of Honour", "Evelyn Waugh"],
            ["Moby Dick", "Herman Melville"],
            ["The Lord of the Rings", "J. R. R. Tolkien"]
        ]);

        describe('Should output nodes', () => {
            [
                {
                    name: "Book Author & Title (relative)",
                    params: {expression: ['Title:store.book[*].title', 'Author:store.book[*].author']},
                    expectation: {headers: ['Title', 'Author'], rows: titleAuthorResult()}
                },
                {
                    name: "Book Author & Title (absolute)",
                    params: {expression: ['Title:$..store.book[*].title', 'Author:$..store.book[*].author']},
                    expectation: {headers: ['Title', 'Author'], rows: titleAuthorResult()}
                },
                {
                    name: "Book Author & Title (absolute, no headers)",
                    params: {expression: ['$..store.book[*].title', '$..store.book[*].author']},
                    expectation: {headers: [NO_HEADER, NO_HEADER], rows: titleAuthorResult().slice(1)}
                },
                {
                    name: "Book Author & Title (base'd, missing header)",
                    params: {expression: ['Title:$[*].title', '$[*].author'], base: '$..store.book[*]'},
                    expectation: {headers: ['Title', NO_HEADER], rows: titleAuthorResult('MISSING_1')}
                },
                {
                    name: "Book Author & Title (base'd)",
                    params: {expression: ['Title:$..book[*].title', 'Author:$..book[*].author'], base: '$..store'},
                    expectation: {headers: ['Title', 'Author'], rows: titleAuthorResult()}
                }
            ].map((tst) => it(`Running: ${tst.name}`, () => {
                const {headers, rows} = tabulate(baseData(), tst.params);

                expect(headers).toEqual(tst.expectation.headers);
                expect(rows).toEqual(tst.expectation.rows);
            }));
        });

        describe('Should output nodes as JSON', () => {
            [
                {
                    name: "Store Object (relative)",
                    params: {expression: ['Title:store']},
                    expectation: {headers: ['Title'], rows: fullStoreString}
                },
                {
                    name: "Store Object (absolute)",
                    params: {expression: ['Title:$..store']},
                    expectation: {headers: ['Title'], rows: fullStoreString}
                }
            ].map((tst) => it(`Running: ${tst.name}`, () => {
                const {headers, rows} = tabulate(baseData(), tst.params);

                expect(headers).toEqual(tst.expectation.headers);
                expect(rows).toEqual(tst.expectation.rows);
            }));
        });
    });

    describe("Command Line Interface", () => {
        [{
            name: "Book Author & Title (absolute; table)",
            params: ["--in", dataPath, 'Title:$..store.book[*].title', 'Author:$..store.book[*].author'],
            expectation: {
                code: EXIT_SUCCESS,
                out:"Title                  | Author          \n" +
                    "---------------------- | ----------------\n" +
                    "Sayings of the Century | Nigel Rees      \n" +
                    "Sword of Honour        | Evelyn Waugh    \n" +
                    "Moby Dick              | Herman Melville \n" +
                    "The Lord of the Rings  | J. R. R. Tolkien\n"
            }
        },
        {
            name: "Book Author & Title (absolute; csv)",
            params: ["--in", dataPath, '--format', 'csv', 'Title:$..store.book[*].title', 'Author:$..store.book[*].author'],
            expectation: {
                code: EXIT_SUCCESS,
                out:"Title,Author\n" +
                    "\"Sayings of the Century\",\"Nigel Rees\"\n" +
                    "\"Sword of Honour\",\"Evelyn Waugh\"\n" +
                    "\"Moby Dick\",\"Herman Melville\"\n" +
                    "\"The Lord of the Rings\",\"J. R. R. Tolkien\""
            }
        },
        {
            name: "Book Author & Title (absolute; json_pretty)",
            params: ["--in", dataPath, '--format', 'json_pretty', 'Title:$..store.book[*].title', 'Author:$..store.book[*].author'],
            expectation: {
                code: EXIT_SUCCESS,
                out:"[\n" +
                    "  [\n" +
                    "    \"Title\",\n" +
                    "    \"Author\"\n" +
                    "  ],\n" +
                    "  [\n" +
                    "    \"Sayings of the Century\",\n" +
                    "    \"Nigel Rees\"\n" +
                    "  ],\n" +
                    "  [\n" +
                    "    \"Sword of Honour\",\n" +
                    "    \"Evelyn Waugh\"\n" +
                    "  ],\n" +
                    "  [\n" +
                    "    \"Moby Dick\",\n" +
                    "    \"Herman Melville\"\n" +
                    "  ],\n" +
                    "  [\n" +
                    "    \"The Lord of the Rings\",\n" +
                    "    \"J. R. R. Tolkien\"\n" +
                    "  ]\n" +
                    "]"
            }
        },
        {
            name: "Book Author & Title (absolute; json)",
            params: ["--in", dataPath, '--format', 'json', 'Title:$..store.book[*].title', 'Author:$..store.book[*].author'],
            expectation: {
                code: EXIT_SUCCESS,
                out:'[["Title","Author"],["Sayings of the Century","Nigel Rees"],["Sword of Honour","Evelyn Waugh"],["Moby Dick","Herman Melville"],["The Lord of the Rings","J. R. R. Tolkien"]]'
            }
        }].map((tst) => it(`Running: ${tst.name}`, () => {
            const result = exec(tst.params);
            expect(result.buffer).toEqual(tst.expectation.out);
            expect(result.code).toEqual(tst.expectation.code);
        }));
    });
})

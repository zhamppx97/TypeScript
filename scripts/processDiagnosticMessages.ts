import path = require("path");
import fs = require("fs");

interface DiagnosticDetails {
    category: string;
    code: number;
    reportsUnnecessary?: {};
    isEarly?: boolean;
}

type InputDiagnosticMessageTable = Map<string, DiagnosticDetails>;

function main(): void {
    if (process.argv.length < 3) {
        console.log("Usage:");
        console.log("\tnode processDiagnosticMessages.js <diagnostic-json-input-file>");
        return;
    }

    function writeFile(fileName: string, contents: string) {
        fs.writeFile(path.join(path.dirname(inputFilePath), fileName), contents, { encoding: "utf-8" }, err => {
            if (err) throw err;
        });
    }

    const inputFilePath = process.argv[2].replace(/\\/g, "/");
    console.log(`Reading diagnostics from ${inputFilePath}`);
    const inputStr = fs.readFileSync(inputFilePath, { encoding: "utf-8" });

    const diagnosticMessagesJson: { [key: string]: DiagnosticDetails } = JSON.parse(inputStr);

    const diagnosticMessages: InputDiagnosticMessageTable = new Map();
    for (const key in diagnosticMessagesJson) {
        if (Object.hasOwnProperty.call(diagnosticMessagesJson, key)) {
            diagnosticMessages.set(key, diagnosticMessagesJson[key]);
        }
    }

    const outputFilesDir = path.dirname(inputFilePath);
    const thisFilePathRel = path.relative(process.cwd(), outputFilesDir);

    const infoFileOutput = buildInfoFileOutput(diagnosticMessages, "./diagnosticInformationMap.generated.ts", thisFilePathRel);
    checkForUniqueCodes(diagnosticMessages);
    writeFile("diagnosticInformationMap.generated.ts", infoFileOutput);

    const messageOutput = buildDiagnosticMessageOutput(diagnosticMessages);
    writeFile("diagnosticMessages.generated.json", messageOutput);
}

function checkForUniqueCodes(diagnosticTable: InputDiagnosticMessageTable) {
    const allCodes: { [key: number]: true | undefined } = [];
    diagnosticTable.forEach(({ code }) => {
        if (allCodes[code]) {
            throw new Error(`Diagnostic code ${code} appears more than once.`);
        }
        allCodes[code] = true;
    });
}

function buildInfoFileOutput(messageTable: InputDiagnosticMessageTable, inputFilePathRel: string, thisFilePathRel: string): string {
    let result =
        "// <auto-generated />\r\n" +
        "// generated from '" + inputFilePathRel + "' by '" + thisFilePathRel.replace(/\\/g, '/') + "'\r\n" +
        "/* @internal */\r\n" +
        "namespace ts {\r\n" +
        "    function diag(code: number, category: DiagnosticCategory, key: string, message: string, reportsUnnecessary?: {}): DiagnosticMessage {\r\n" +
        "        return { code, category, key, message, reportsUnnecessary };\r\n" +
        "    }\r\n" +
        "    // tslint:disable-next-line variable-name\r\n" +
        "    export const Diagnostics = {\r\n";
    messageTable.forEach(({ code, category, reportsUnnecessary }, name) => {
        const propName = convertPropertyName(name);
        const argReportsUnnecessary = reportsUnnecessary ? `, /*reportsUnnecessary*/ ${reportsUnnecessary}` : "";
        result += `        ${propName}: diag(${code}, DiagnosticCategory.${category}, "${createKey(propName, code)}", ${JSON.stringify(name)}${argReportsUnnecessary}),\r\n`;
    });

    result += "    };\r\n}";

    return result;
}

function buildDiagnosticMessageOutput(messageTable: InputDiagnosticMessageTable): string {
    let result = "{";
    messageTable.forEach(({ code }, name) => {
        const propName = convertPropertyName(name);
        result += `\r\n  "${createKey(propName, code)}" : "${name.replace(/[\"]/g, '\\"')}",`;
    });

    // Shave trailing comma, then add newline and ending brace
    result = result.slice(0, result.length - 1) + "\r\n}";

    // Assert that we generated valid JSON
    JSON.parse(result);

    return result;
}

function createKey(name: string, code: number): string {
    return name.slice(0, 100) + "_" + code;
}

function convertPropertyName(origName: string): string {
    let result = origName.split("").map(char => {
        if (char === "*") { return "_Asterisk"; }
        if (char === "/") { return "_Slash"; }
        if (char === ":") { return "_Colon"; }
        return /\w/.test(char) ? char : "_";
    }).join("");

    // get rid of all multi-underscores
    result = result.replace(/_+/g, "_");

    // remove any leading underscore, unless it is followed by a number.
    result = result.replace(/^_([^\d])/, "$1");

    // get rid of all trailing underscores.
    result = result.replace(/_$/, "");

    return result;
}

main();

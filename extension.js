const vscode = require('vscode')
const PACKAGE_NAME = 'autoSurround'
const escapeStringRegexp = require('escape-string-regexp')

let config = {}
let keysList = []
let leftKeysList = []
let rightKeysList = []
let escapedKeysList = null

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    await readConfig()

    vscode.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration(PACKAGE_NAME)) {
            await readConfig()
        }
    })

    context.subscriptions.push(vscode.commands.registerCommand('type', doStuff))
}

async function doStuff(e) {
    let {text} = e
    let editor = vscode.window.activeTextEditor
    let {document, selections} = editor
    let newSelections = false
    let dir = null

    for (const selection of invertSelections(selections)) {
        let selectedText = document.getText(selection)
        let areEqual = allEqual(selectedText)
        let underLen = selectedText.length > 1 && selectedText.length <= config.ignoreSurroundMappedCharsLength

        let isLeft = leftKeysList.includes(text)
        let isRight = rightKeysList.includes(text)
        let isSupported = keysList.includes(text) || isLeft || isRight

        // replace each
        if (config.replaceAllWithMappedChars && underLen && areEqual && isSupported) {
            newSelections = true
            let char = selectedText.charAt(0)
            let replacement = selectedText.replace(new RegExp(escapeStringRegexp(char), 'g'), text)

            await editor.edit(
                (edit) => edit.replace(selection, replacement),
                {undoStopBefore: true, undoStopAfter: true}
            )

            continue
        }

        // do nothing
        if (
            (config.ignoreSurroundIfFirst && new RegExp(`^(${escapedKeysList})`, 'i').test(selectedText)) ||
            (config.ignoreSurroundIfLast && new RegExp(`(${escapedKeysList})$`, 'i').test(selectedText)) ||
            (config.ignoreSurroundMappedChars && underLen && areEqual)
        ) {
            continue
        }

        // surround
        if (!selection.isEmpty && isSupported) {
            newSelections = true
            let {start, end} = selection

            await editor.edit(
                (edit) => {
                    if (isLeft) {
                        dir = 'l'

                        edit.insert(start, text)
                    } else if (isRight) {
                        dir = 'r'

                        edit.insert(end, text)
                    } else {
                        dir = null

                        edit.insert(start, text)
                        edit.insert(end, text)
                    }
                },
                {undoStopBefore: true, undoStopAfter: false}
            )
        }
    }

    newSelections
        ? updateSelection(dir)
        : vscode.commands.executeCommand('default:type', {text: text})
}

function updateSelection(dir) {
    let newSelections = []
    let isOutIn = config.mode == 'out-in'
    let editor = vscode.window.activeTextEditor
    let {selections} = editor

    for (const selection of selections) {
        let {start, end} = selection
        let range = null

        switch (dir) {
            case 'l':
                range = new vscode.Selection(
                    start.line,
                    isOutIn ? start.character : start.character - 1,
                    end.line,
                    end.character
                )
                break
            case 'r':
                range = new vscode.Selection(
                    start.line,
                    start.character,
                    end.line,
                    isOutIn ? end.character - 1 : end.character
                )
                break

            default:
                range = new vscode.Selection(
                    start.line,
                    isOutIn ? start.character : start.character - 1,
                    end.line,
                    isOutIn ? end.character - 1 : end.character
                )
                break
        }

        newSelections.push(range)
    }

    editor.selections = newSelections
}

/* Config --------------------------------------------------------------------- */
async function readConfig() {
    config = await vscode.workspace.getConfiguration(PACKAGE_NAME)
    keysList = config.list
    leftKeysList = config.oneSideSurround.left
    rightKeysList = config.oneSideSurround.right

    escapedKeysList = [...keysList, ...leftKeysList, ...rightKeysList].map((e) => escapeStringRegexp(e)).join('|')
}

/* Util --------------------------------------------------------------------- */
function allEqual(str) {
    let main = str[0]
    let arr = str.split('')
    let test = arr.every((char) => char === main)

    return arr.length && test
        ? keysList.includes(main)
        : false
}

function invertSelections(arr) {
    return arr.sort((a, b) => {
        if (a.start.line != b.start.line) { // different lines
            if (a.start.line > b.start.line) return 1
            if (b.start.line > a.start.line) return -1
        } else { // same line
            if (a.start.character > b.start.character) return 1
            if (b.start.character > a.start.character) return -1
        }

        return 0
    }).reverse()
}

/* --------------------------------------------------------------------- */
function deactivate() { }

module.exports = {
    activate,
    deactivate
}

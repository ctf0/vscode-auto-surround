const vscode = require('vscode')
const PACKAGE_NAME = 'auto-surround'
const escapeStringRegexp = require('escape-string-regexp')

let config = {}
let keysList = []
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
    let { text } = e
    let editor = vscode.window.activeTextEditor
    let { document, selections } = editor
    let newSelections = []
    let isOutIn = config.mode == 'out-in'

    for (const select of selections) {
        let selectedText = document.getText(select)

        if (
            (config.ignoreSurroundIfFirst && new RegExp(`^(${escapedKeysList})`, 'i').test(selectedText)) ||
            (config.ignoreSurroundIfLast && new RegExp(`(${escapedKeysList})$`, 'i').test(selectedText)) ||
            (
                config.ignoreSurroundMappedChars &&
                selectedText.length <= config.ignoreSurroundMappedCharsLength &&
                allEqual(selectedText)
            )
        ) {
            continue
        }

        let { start, end } = select
        let range = new vscode.Range(start, end)

        if (!range.isEmpty && keysList.includes(text)) {
            await editor.edit(
                (edit) => {
                    edit.insert(start, text)
                    edit.insert(end, text)

                    newSelections.push(new vscode.Selection(
                        start.line,
                        isOutIn ? start.character + 1 : start.character,
                        end.line,
                        end.character + (isOutIn ? 1 : text.length * 2)
                    ))
                },
                { undoStopBefore: true, undoStopAfter: false }
            )
        }
    }

    newSelections.length
        ? editor.selections = newSelections
        : vscode.commands.executeCommand('default:type', { text: text })
}

function allEqual(str) {
    let main = str[0]
    let arr = str.split('')
    let test = arr.every((char) => char === main)

    return arr.length && test
        ? keysList.includes(main)
        : false
}

async function readConfig() {
    config = await vscode.workspace.getConfiguration(PACKAGE_NAME)
    keysList = config.list
    escapedKeysList = keysList.map((e) => escapeStringRegexp(e)).join('|')
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}

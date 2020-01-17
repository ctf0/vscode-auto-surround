const vscode = require('vscode')
const PACKAGE_NAME = 'auto-surround'

let config = {}
let keysList = []

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

    for (const select of selections) {
        if (config.ignoreSurroundMappedChars && keysList.includes(document.getText(select))) {
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
                        start.character,
                        end.line,
                        end.character + text.length * 2
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

async function readConfig() {
    config = await vscode.workspace.getConfiguration(PACKAGE_NAME)
    keysList = config.list
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}

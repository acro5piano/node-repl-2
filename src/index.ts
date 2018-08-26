const readline = require('readline');
const stream = require('stream');
const vm = require('vm');

readline.createInterface( process.stdin, {} );

readline.emitKeypressEvents(process.stdin);
process.stdin.setEncoding( 'utf8' );

let count = 1
let cursorPosition = 0
let content = ''
let history = []
let historyIndex = 0

process.stdin.setRawMode(true);

const getPrompt = () => `In [${count}]: `

const setPrompt = () => {
    process.stdout.cursorTo(0);
    process.stdout.clearLine()
    process.stdout.write(getPrompt());
    process.stdout.write(content)
}

const setPromptLn = () => {
    process.stdout.write(`\n`)
    setPrompt()
}

setPrompt()

const sandbox = {
    console: {
        ...console,
    }
}

const ctx = vm.createContext(sandbox); // Contextify the sandbox.

const onKeyPress = async (str, key) => {
    if (key.name === 'backspace') {
        content = content.substr(0, cursorPosition - 1) + content.substr(cursorPosition, content.length)
        cursorPosition--
        setPrompt()
        process.stdout.cursorTo(getPrompt().length + cursorPosition)
        return
    }

    if (key.name === 'return') {
        history.push(content)
        historyIndex = history.length
        cursorPosition = 0
        console.log()
        try {
            const res = await vm.runInContext(content, ctx);
            console.log(res)
        } catch (e) {
            console.error(e)
        } finally {
            content = ''
            count++
            setPromptLn()
        }
        return
    }

    if (key.ctrl && key.name === 'c') {
        process.exit(0)
        return
    }

    if (key.ctrl && key.name === 'd') {
        if (content === '') {
            process.exit(0)
            return
        }
        content = content.slice(0, -1)
    }

    if (key.ctrl && key.name === 'a') {
        process.stdout.cursorTo(getPrompt().length);
        return
    }

    if (key.ctrl && key.name === 'a') {
        process.stdout.cursorTo(content.length);
        return
    }

    if (key.ctrl && key.name === 'b') {
        process.stdout.moveCursor(-1);
        cursorPosition--
        return
    }

    if (key.ctrl && key.name === 'f') {
        process.stdout.moveCursor(1);
        cursorPosition++
        return
    }

    if (key.ctrl && key.name === 'p') {
        if (historyIndex === 0) {
            return
        }
        historyIndex--
        content = history[historyIndex]
        setPrompt()
        return
    }

    if (key.ctrl && key.name === 'n') {
        if (historyIndex === history.length) {
            return
        }
        historyIndex++
        content = history[historyIndex]
        setPrompt()
        return
    }

    cursorPosition++
    content += key.sequence
    setPrompt()
}

process.stdin.on('keypress', onKeyPress)

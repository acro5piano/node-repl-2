// const file = `${process.env.PWD}/src/repl.ts`
const file = `${process.env.PWD}/jest.config.js`

// const queries = [
// {
//   seq: 0,
//   type: 'request',
//   command: 'open',
//   arguments: { file },
// },
// {
//   seq: 1,
//   type: 'request',
//   command: 'quickinfo',
//   arguments: { file, line: 41, offset: 21 },
// },
// {
//   seq: 2,
//   type: 'request',
//   command: 'completions',
//   arguments: { file, line: 6, offset: 34 },
// },
// ]

const queries = [
  {
    jsonrpc: '2.0',
    id: 1,
    method: 'textDocument/completion',
    params: {
      textDocument: {
        uri: file,
      },
      position: {
        line: 6,
        character: 34,
      },
    },
  },
]

queries.forEach(query => console.log(JSON.stringify(query)))

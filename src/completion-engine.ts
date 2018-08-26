import { Context } from 'vm'

const blackList = Object.getOwnPropertyNames(global).concat(['require', 'console'])

const makeClassCompletion = (obj: any) => {
  if (!obj) {
    return
  }
  const completions = new Set()
  Object.getOwnPropertyNames(obj).forEach(x => completions.add(x))
  Object.getOwnPropertyNames(obj.prototype).forEach(x => completions.add(x))
  if (obj.constructor) {
    Object.getOwnPropertyNames(new obj()).forEach(x => completions.add(x))
  }
  return Array.from(completions)
}

export const getCursorWord = (line: string, cursorPosition: number, result = ''): string => {
  if (cursorPosition === 0) {
    return ''
  }
  const targetWord = (line + ' ')[cursorPosition]
  if (targetWord === ' ' && result !== '') {
    return result
      .split('')
      .reverse()
      .join('')
      .replace(/ /, '')
  }
  return getCursorWord(line, cursorPosition - 1, result + targetWord)
}

export const complete = (ctx: Context, line: string, cursorPosition: number) => {
  const localVars = Object.keys(ctx)
    .filter(x => !blackList.includes(x))
    .reduce((car, cur) => ({ ...car, [cur]: (ctx as any)[cur] }), {})

  const [obj, method] = getCursorWord(line, cursorPosition).split('.')
  const hoge = makeClassCompletion((ctx as any)[obj] || (global as any)[obj])
  if (!hoge) {
    return { localVars, omniCompletions: [] }
  }
  const omniCompletions = hoge.filter(x => x.startsWith(method))
  return { localVars, omniCompletions, search: { class: obj, method } }
}

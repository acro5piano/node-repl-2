import { Context } from 'vm'

const blackList = ['console', 'require']

export const complete = (ctx: Context, line: string, cursorPosition: number) => {
  const localVars = Object.keys(ctx)
    .filter(x => !blackList.includes(x))
    .reduce((car, cur) => ({ ...car, [cur]: (ctx as any)[cur] }), {})
  return { localVars }
}

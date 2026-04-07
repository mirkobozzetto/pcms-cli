import * as readline from 'node:readline/promises'
import * as process from 'node:process'

export async function promptText(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  try {
    const answer = await rl.question(question)
    return answer
  } finally {
    rl.close()
  }
}

export async function promptHidden(question: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    process.stdout.write(question)

    const chars: string[] = []

    const onData = (key: Buffer): void => {
      const str = key.toString()

      if (str === '\r' || str === '\n') {
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener('data', onData)
        process.stdout.write('\n')
        resolve(chars.join(''))
        return
      }

      if (str === '\u0003') {
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener('data', onData)
        process.stdout.write('\n')
        reject(new Error('Interrupted'))
        return
      }

      if (str === '\u007f' || str === '\b') {
        chars.pop()
        return
      }

      chars.push(str)
    }

    try {
      process.stdin.setRawMode(true)
      process.stdin.resume()
      process.stdin.on('data', onData)
    } catch (err) {
      reject(err)
    }
  })
}

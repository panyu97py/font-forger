import fs from 'fs'
import crypto from 'crypto'

export const fileHash = (filePath:string, algorithm = 'sha256') => {
  return new Promise<string>((resolve, reject) => {
    const hash = crypto.createHash(algorithm)

    const stream = fs.createReadStream(filePath)

    stream.on('data', chunk => hash.update(chunk))

    stream.on('end', () => resolve(hash.digest('hex').toString()))

    stream.on('error', reject)
  })
}

export const createLoading = () => {
  let index = 0

  let timer: NodeJS.Timeout

  const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

  const startLoading = (msg: string) => {
    timer = setInterval(() => {
      process.stdout.clearLine(0)
      process.stdout.cursorTo(0)
      process.stdout.write(`\r${FRAMES[index % FRAMES.length]} ${msg}`)
      index++
    }, 100)
  }

  const stopLoading = (msg: string, isSuccess: boolean = true) => {
    clearInterval(timer)
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    process.stdout.write(`\r${isSuccess ? '✔' : '✖'} ${msg}\n`)
  }

  return { startLoading, stopLoading }
}

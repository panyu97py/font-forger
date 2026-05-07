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

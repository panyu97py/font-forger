import process from 'process'
import fsPromises from 'fs/promises'
import { fileURLToPath } from 'url'
import fs from 'fs'
import path from 'path'

export type FindUpPath = string | URL;
export type FindUpType = 'file' | 'directory';

export interface FindUpOptions {
    cwd?: FindUpPath;
    type?: FindUpType;
    stopAt?: FindUpPath;
}

const toPath = (urlOrPath: FindUpPath): string => urlOrPath instanceof URL ? fileURLToPath(urlOrPath) : urlOrPath

export const findUp = async (name: string, opts: FindUpOptions = {}) => {
  const { cwd = process.cwd(), type = 'file', stopAt } = opts
  let directory = path.resolve(toPath(cwd))
  const { root } = path.parse(directory)
  const resolvedStopAt = path.resolve(directory, toPath(stopAt ?? root))
  const isAbsoluteName = path.isAbsolute(name)

  while (directory) {
    const filePath = isAbsoluteName ? name : path.join(directory, name)
    try {
      const stats = await fsPromises.stat(filePath)
      if ((type === 'file' && stats.isFile()) || (type === 'directory' && stats.isDirectory())) return filePath
    } catch {}

    if (directory === resolvedStopAt || directory === root) break

    directory = path.dirname(directory)
  }
}

export const findUpSync = (name: string, opts: FindUpOptions = {}) => {
  const { cwd = process.cwd(), type = 'file', stopAt } = opts
  let directory = path.resolve(toPath(cwd))
  const { root } = path.parse(directory)
  const resolvedStopAt = path.resolve(directory, toPath(stopAt ?? root))
  const isAbsoluteName = path.isAbsolute(name)

  while (directory) {
    const filePath = isAbsoluteName ? name : path.join(directory, name)

    try {
      const stats = fs.statSync(filePath, { throwIfNoEntry: false })
      if ((type === 'file' && stats?.isFile()) || (type === 'directory' && stats?.isDirectory())) return filePath
    } catch {}

    if (directory === resolvedStopAt || directory === root) break

    directory = path.dirname(directory)
  }
}

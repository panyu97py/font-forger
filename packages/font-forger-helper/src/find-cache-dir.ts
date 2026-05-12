import process from 'process'
import path from 'path'
import fs from 'fs'
import { commonPathPrefix } from './common-path'
import { packageDirectorySync } from './find-pkg-dir'

const { env, cwd } = process

export interface FindCacheDirectoryOptions {
    name: string;
    cwd?: string;
    files?: readonly string[];
    create?: boolean;
}

const isWritable = (filePath: string): boolean => {
  try {
    fs.accessSync(filePath, fs.constants.W_OK)
    return true
  } catch {
    return false
  }
}

export const useDirectory = (directory: string, options: Pick<FindCacheDirectoryOptions, 'create'>) => {
  if (options.create)fs.mkdirSync(directory, { recursive: true })
  return directory
}

export const getNodeModuleDirectory = (directory: string) => {
  const nodeModules = path.join(directory, 'node_modules')
  if (!isWritable(nodeModules) && (fs.existsSync(nodeModules) || !isWritable(path.join(directory)))) return
  return nodeModules
}

export const findCacheDirectory = (options: FindCacheDirectoryOptions) => {
  if (env.CACHE_DIR && !['true', 'false', '1', '0'].includes(env.CACHE_DIR)) return useDirectory(path.join(env.CACHE_DIR, options.name), options)

  let { cwd: directory = cwd(), files } = options

  if (files) {
    if (!Array.isArray(files)) throw new TypeError(`Expected \`files\` option to be an array, got \`${typeof files}\`.`)
    directory = commonPathPrefix(files.map(file => path.resolve(directory, file)))
  }

  const packageDirectory = packageDirectorySync({ cwd: directory })

  if (!packageDirectory) return

  const nodeModules = getNodeModuleDirectory(packageDirectory)
  if (!nodeModules) return

  return useDirectory(path.join(nodeModules, '.cache', options.name), options)
}

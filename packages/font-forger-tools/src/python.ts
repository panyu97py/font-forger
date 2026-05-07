import fs from 'fs'
import { spawn } from 'child_process'
import os from 'os'
import { FRAMES, PYTHON_VERSION, RELEASE } from './constants'
import findCacheDirectory from 'find-cache-directory'
import path from 'path'
import got from 'got'
import { pipeline } from 'stream/promises'
import * as tar from 'tar'

/**
 * 获取当前系统架构
 */
export const resolveArch = () => {
  const arch = os.arch()
  if (arch === 'x64') return 'x86_64'
  if (arch === 'arm64') return 'aarch64'
  throw new Error(`unsupported arch: ${arch}`)
}

/**
 * 获取 python 运行时环境目标平台
 */
export const resolveTarget = () => {
  const platform = os.platform()
  const arch = resolveArch()
  if (platform === 'darwin') return `${arch}-apple-darwin`
  if (platform === 'linux') return `${arch}-unknown-linux-gnu`
  if (platform === 'win32') return `${arch}-pc-windows-msvc`
  throw new Error(`unsupported platform: ${platform}`)
}

/**
 * 获取 python 运行时环境下载地址
 */
export const getDownloadUrl = () => {
  const target = resolveTarget()
  const filename = `cpython-${PYTHON_VERSION}+${RELEASE}-${target}-install_only.tar.gz`
  const baseUrl = `https://github.com/astral-sh/python-build-standalone/releases/download/${RELEASE}`
  return `${baseUrl}/${filename}`
}

/**
 * 获取 python 运行时环境可执行文件路径
 */
export const getPythonExecutable = () => {
  const cacheDirectory = findCacheDirectory({ name: 'font-forger' })
  if (!cacheDirectory) throw new Error('cache directory not found')
  const platform = os.platform()
  const runtimeDir = path.join(cacheDirectory, 'python')
  if (platform === 'win32') return path.join(runtimeDir, 'python.exe')
  return path.join(runtimeDir, 'bin', 'python3')
}

export const downloadPythonRuntime = async () => {
  const url = getDownloadUrl()
  const cacheDirectory = findCacheDirectory({ name: 'font-forger' })
  if (!cacheDirectory) throw new Error('cache directory not found')

  const stream = got.stream(url)
  const listener = (data:any) => {
    const percent = Math.floor(data.percent * 100)
    const frame = FRAMES[percent % FRAMES.length]
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    if (data.total && percent < 100) process.stdout.write(`\r${frame} Downloading runtime ${percent}%`)
    if (data.total && percent === 100) process.stdout.write('\r✔ Downloaded runtime\n')
  }
  stream.on('downloadProgress', listener)

  const tarFilePath = path.join(cacheDirectory, 'python.tar.gz')
  await fs.promises.mkdir(cacheDirectory, { recursive: true })
  await pipeline(stream, fs.createWriteStream(tarFilePath))
  await tar.x({ file: tarFilePath, cwd: cacheDirectory })
}

/**
 * 执行 python 脚本
 * @param args python 脚本参数
 */
export const runPython = async (args: string[]) => {
  const pythonExecutable = getPythonExecutable()

  if (!fs.existsSync(pythonExecutable)) await downloadPythonRuntime()

  return new Promise((resolve, reject) => {
    const child = spawn(pythonExecutable, args, { stdio: 'pipe' })

    child.stdout.on('data', (data) => resolve(data.toString()))

    child.stderr.on('data', (data) => reject(data.toString()))
  })
}

import path from 'path'
import fs from 'fs'
import fsPromises from 'fs/promises'
import process from 'process'
import { findUp, findUpSync } from './find-up'

export interface PackageDirectoryOptions {
    cwd?: string | URL;
    ignoreTypeOnlyPackageJson?: boolean;
}

const isTypeOnlyPackageJsonData = (packageData: unknown): packageData is {type: string} => {
  if (!packageData || typeof packageData !== 'object' || Array.isArray(packageData)) return false
  const packageJsonData = packageData as Record<string, unknown>
  const keys = Object.keys(packageData)
  return keys.length === 1 && keys[0] === 'type' && typeof packageJsonData.type === 'string'
}

const isTypeOnlyPackageJson = async (filePath: string): Promise<boolean> => {
  let fileContents

  try {
    fileContents = await fsPromises.readFile(filePath, 'utf8')
  } catch {
    return false
  }

  try {
    return isTypeOnlyPackageJsonData(JSON.parse(fileContents))
  } catch {
    return false
  }
}

const isTypeOnlyPackageJsonSync = (filePath: string): boolean => {
  let fileContents

  try {
    fileContents = fs.readFileSync(filePath, 'utf8')
  } catch {
    return false
  }

  try {
    return isTypeOnlyPackageJsonData(JSON.parse(fileContents))
  } catch {
    return false
  }
}

const getNextSearchDirectory = (filePath: string): string | undefined => {
  const packageDirectoryPath = path.dirname(filePath)
  const parentDirectoryPath = path.dirname(packageDirectoryPath)
  return parentDirectoryPath === packageDirectoryPath ? undefined : parentDirectoryPath
}

const findPackageDirectory = async (directory: string | URL, ignoreTypeOnlyPackageJson?: boolean) => {
  const filePath = await findUp('package.json', { cwd: directory })
  if (!filePath) return undefined

  const packageDirectoryPath = path.dirname(filePath)
  if (!ignoreTypeOnlyPackageJson) return packageDirectoryPath

  if (!await isTypeOnlyPackageJson(filePath)) return packageDirectoryPath

  const nextDirectory = getNextSearchDirectory(filePath)
  if (!nextDirectory) return undefined

  return findPackageDirectory(nextDirectory, ignoreTypeOnlyPackageJson)
}

const findPackageDirectorySync = (directory: string | URL, ignoreTypeOnlyPackageJson?: boolean) => {
  const filePath = findUpSync('package.json', { cwd: directory })
  if (!filePath) return undefined

  const packageDirectoryPath = path.dirname(filePath)
  if (!ignoreTypeOnlyPackageJson) return packageDirectoryPath

  if (!isTypeOnlyPackageJsonSync(filePath)) return packageDirectoryPath

  const nextDirectory = getNextSearchDirectory(filePath)
  if (!nextDirectory) return undefined

  return findPackageDirectorySync(nextDirectory, ignoreTypeOnlyPackageJson)
}

export async function packageDirectory (opt: PackageDirectoryOptions = {}) {
  const { cwd, ignoreTypeOnlyPackageJson } = opt
  return findPackageDirectory(cwd ?? process.cwd(), ignoreTypeOnlyPackageJson)
}

export function packageDirectorySync (opt: PackageDirectoryOptions = {}): string | undefined {
  const { cwd, ignoreTypeOnlyPackageJson } = opt
  return findPackageDirectorySync(cwd ?? process.cwd(), ignoreTypeOnlyPackageJson)
}

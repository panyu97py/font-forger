import { downloadPythonRuntime, getPythonExecutable } from './utils'
import fs from 'fs'
import { spawn } from 'child_process'

export const runPython = async () => {
  const pythonExecutable = getPythonExecutable()

  if (!fs.existsSync(pythonExecutable)) await downloadPythonRuntime()

  const child = spawn(pythonExecutable, ['--version'], { stdio: 'inherit' })

  child.on('exit', (code) => console.log('exit:', code))
}

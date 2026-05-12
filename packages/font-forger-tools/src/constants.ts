import path from 'path'
import findCacheDirectory from 'find-cache-dir'

export const PYTHON_VERSION = '3.12.2'

export const RELEASE = '20240224'

export const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export const CACHE_DIR = findCacheDirectory({ name: '@font-forger/tools' }) || path.join(__dirname, '../node_modules/.cache')

export const PYFTSUBSET_PEX = path.resolve(__dirname, './pex/pyftsubset.pex')

export const PYFTCHARS_PEX = path.resolve(__dirname, './pex/pyftschars.pex')

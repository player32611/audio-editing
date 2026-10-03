// better-sqlite3 v13 在 npm 包内附带的是「纯 Node ABI」的预编译二进制，
// 与 Electron 的 ABI 不一致。而它的 binding.gyp 里只要检测到这些预编译
// 文件存在，就会跳过源码编译（target type: none），导致 electron-rebuild
// / install-app-deps 表面上“成功”却拿不到 Electron 可用的 .node。
//
// 这里在 postinstall 阶段先把这些 Node-ABI 预编译文件删掉，
// 让 install-app-deps 走源码编译，产出 Electron ABI 的二进制。
import { rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const prebuildsDir = join(root, 'node_modules', 'better-sqlite3', 'prebuilds')

const nodeAbiPrebuilds = [
  'win32-x64.node',
  'win32-arm64.node',
  'darwin-x64.node',
  'darwin-arm64.node',
  'linux-x64.node',
  'linux-arm64.node',
  'linuxmusl-x64.node',
  'linuxmusl-arm64.node'
]

for (const file of nodeAbiPrebuilds) {
  rmSync(join(prebuildsDir, file), { force: true })
}

console.log('[fix-better-sqlite3] removed Node-ABI prebuilds, will source-build for Electron')

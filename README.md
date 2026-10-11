# Audio Editing

基于 Electron 的桌面端音频处理工具，提供音频提取、音频裁剪、音频标签与封面编辑等功能。内置 FFmpeg / FFprobe，用户无需手动安装任何依赖，开箱即用。

## 功能特性

- **音频提取** — 从视频中提取音频，支持 `mp3` / `m4a` / `aac` / `ogg` / `wav` / `flac` 输出格式，可设置码率、质量与截取范围
- **音频裁剪** — 按时间范围裁剪音频，支持相同的输出格式、码率与质量选项
- **音频编辑** — 编辑音频元数据标签（标题、艺术家、专辑、流派、封面等），并支持内嵌封面（`mp3` / `flac` / `m4a`）
- **汉英转译** — 规划中的功能（当前为「建设中」）
- **工作历史** — 自动记录处理任务，支持状态跟踪（待处理 / 处理中 / 已完成 / 已中断）与批量删除
- **内置 FFmpeg / FFprobe** — 随应用打包，无需用户额外安装
- **主题切换** — 浅色 / 深色 / 跟随系统
- **路径管理** — 自定义默认输入 / 输出 / 封面目录
- **单实例运行** — 重复启动会聚焦到已有窗口；退出时若有任务进行会二次确认
- **自动更新** — 基于 electron-updater（发布到 GitHub Releases）

## 技术栈

| 类别       | 技术                                                               |
| ---------- | ------------------------------------------------------------------ |
| 桌面框架   | Electron 39                                                        |
| 前端       | React 19 + TypeScript 5.9                                          |
| 构建       | electron-vite 5（Vite 7）                                          |
| 打包       | electron-builder 26（Windows: NSIS + portable；macOS: dmg；Linux: AppImage / snap / deb） |
| UI 组件库  | Ant Design 6 + @ant-design/icons                                   |
| 样式       | Sass                                                               |
| 路由       | react-router 8（hash 模式）                                        |
| 本地数据库 | better-sqlite3 13（SQLite，WAL 模式）                              |
| 本地配置   | electron-store 11                                                  |
| 音视频处理 | fluent-ffmpeg + @ffmpeg-installer/ffmpeg + @ffprobe-installer/ffprobe |
| 自动更新   | electron-updater 6                                                 |

## 环境要求

- Node.js ≥ 20.19（推荐 22 LTS）
- npm（或 yarn）
- Windows 下打包 NSIS 安装包时无需额外安装工具，electron-builder 会自动下载

## 快速开始

### 安装依赖

```bash
npm install
```

> 安装时会自动执行 `postinstall`，通过 `electron-builder install-app-deps` 重建原生依赖（better-sqlite3 等）。

### 开发调试

```bash
npm run dev
```

启动后渲染进程支持 HMR 热更新，按 F12 打开 DevTools。

## 打包

### Windows

```bash
npm run build:win
```

会在 `dist/` 目录下同时产出两个文件：

| 文件                               | 说明                   |
| ---------------------------------- | ---------------------- |
| `audio-editing-1.4.0-setup.exe`    | NSIS 安装包（需安装）  |
| `audio-editing-1.4.0-portable.exe` | 免安装版（双击直接运行） |

其他平台：

```bash
npm run build:mac     # macOS（dmg）
npm run build:linux   # Linux（AppImage / snap / deb）
```

仅生成未打包的应用目录（用于快速验证）可用：

```bash
npm run build:unpack
```

### 内置 FFmpeg 说明

应用通过 `@ffmpeg-installer/ffmpeg` 和 `@ffprobe-installer/ffprobe` 内置 FFmpeg / FFprobe，在 [electron-builder.yml](electron-builder.yml) 中通过 `asarUnpack` 解包。主进程在 [src/main/ffmpeg.ts](src/main/ffmpeg.ts) 中调用 `setupFfmpeg()`，设置 `FFMPEG_PATH` / `FFPROBE_PATH` 环境变量、通过 `fluent-ffmpeg` 指定二进制路径，并将其目录加入 `PATH`，因此 **用户机器上无需手动安装 FFmpeg**。

## 自动更新

应用通过 `electron-updater` 检查并安装更新，发布配置位于 [electron-builder.yml](electron-builder.yml) 的 `publish` 段（默认 GitHub Releases，`owner: player32611` / `repo: audio-editing`）。开发环境更新源配置见 [dev-app-update.yml](dev-app-update.yml)，发布前需将其替换为实际的更新地址。

## 代码签名

接入代码签名证书可消除 Windows SmartScreen 的「未知发布者」警告。推荐通过环境变量提供证书（不要把私钥提交进仓库）：

```bash
export CSC_LINK="E:/certs/code-signing.pfx"      # .pfx/.p12 证书（含私钥）
export CSC_KEY_PASSWORD="你的私钥密码"
npm run build:win
```

也可以在 [electron-builder.yml](electron-builder.yml) 的 `win` 段直接配置：

```yaml
win:
  certificateFile: ./build/cert/code-signing.pfx
  certificatePassword: '你的私钥密码'
```

打包完成后可用 `signtool verify /pa /v dist/audio-editing-1.4.0-setup.exe` 校验签名。

## 项目结构

```
audio-editing/
├─ src/
│  ├─ main/                # 主进程（Electron main）
│  │  ├─ index.ts          # 入口：窗口、单实例锁、任务状态、退出确认
│  │  ├─ api.ts            # 文件/文件夹选择、路径解析、图片读取等 IPC
│  │  ├─ database.ts       # SQLite 建库与增删改查（better-sqlite3）
│  │  ├─ ffmpeg.ts         # 内置 FFmpeg/FFprobe 路径设置 + 音频处理 IPC
│  │  ├─ store.ts          # electron-store：主题、路径配置
│  │  └─ env.d.ts
│  ├─ preload/             # 预加载脚本，通过 contextBridge 暴露 API
│  │  ├─ index.ts
│  │  └─ global.d.ts
│  ├─ renderer/            # 渲染进程（React）
│  │  ├─ index.html
│  │  └─ src/
│  │     ├─ main.tsx
│  │     ├─ App.tsx
│  │     ├─ assets/        # 全局样式（SCSS）
│  │     ├─ components/    # LayoutMenu、ThemeProvider 等通用组件
│  │     ├─ pages/
│  │     │  ├─ Workspace/  # List（历史任务）/ AudioExtract / AudioTrim / AudioEdit
│  │     │  └─ Settings/   # Appearance（主题）/ File（路径）
│  │     ├─ routes/        # 路由（hash 模式）
│  │     ├─ hooks/         # useTools（提取/裁剪/编辑的公共逻辑）
│  │     ├─ utils/
│  │     └─ types/
│  └─ shared/              # 主进程与渲染进程共享的类型、常量与工具
├─ resources/              # 应用图标等资源
├─ build/                  # electron-builder 构建资源（图标等）
├─ electron.vite.config.ts # electron-vite 配置
├─ electron-builder.yml    # electron-builder 打包配置
├─ dev-app-update.yml      # 开发环境自动更新配置
└─ package.json
```

## 常用脚本

| 命令                   | 说明                                |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | 开发模式（HMR）                     |
| `npm run start`        | 预览已构建的应用                    |
| `npm run build`        | 类型检查 + 构建（不打包）           |
| `npm run build:win`    | 构建并打包 Windows（NSIS + portable） |
| `npm run build:mac`    | 构建并打包 macOS（dmg）             |
| `npm run build:linux`  | 构建并打包 Linux（AppImage / snap / deb） |
| `npm run build:unpack` | 构建并生成未打包目录                |
| `npm run typecheck`    | 主进程 + 渲染进程类型检查           |
| `npm run lint`         | ESLint 检查                         |
| `npm run format`       | Prettier 格式化                     |

## 进程间通信（IPC）说明

渲染进程通过 `window` 上的桥接对象调用主进程能力，均在 [src/preload/index.ts](src/preload/index.ts) 中通过 `contextBridge` 暴露：

- `window.electron` — electron-vite 提供的 Electron 基础 API
- `window.api` — 文件 / 文件夹选择、打开目录、在资源管理器中显示、路径解析、图片读取
- `window.theme` — 主题读写与变更监听
- `window.path` — 输入 / 输出 / 封面路径读写
- `window.ffmpeg` — 音频提取（`getVoice`）、音频裁剪（`cutAudio`）、媒体信息（`getMediaData` / `getAudioStream`）、封面读取（`getAudioCover`）、标签写入（`setAudioTags`）
- `window.database` — 工作历史的增删改查（SQLite）
- `window.work` — 进行中任务的实时状态（内存 Map，窗口关闭时清空）

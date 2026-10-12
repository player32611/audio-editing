# Offline Speech-to-Text (whisper.cpp / OpenAI Whisper) — Integration Research

Research date: 2026-10-12. Every factual bullet cites a primary source URL (official repo, official docs, npm registry). Where a primary source was unreachable or a value is derived, that is flagged explicitly.

---

## 1. whisper.cpp

- It is a plain C/C++ implementation of OpenAI's Whisper ASR/translation model, "high-performance inference ... without dependencies," with CPU and GPU backends. https://github.com/ggml-org/whisper.cpp/blob/master/README.md
- License: MIT (repo badge + LICENSE file, "Copyright (c) 2023-2026 The ggml authors"). https://github.com/ggml-org/whisper.cpp/blob/master/LICENSE
- Actively maintained: latest stable release v1.9.5 published 2026-10-06; nightly build tag b5454 published 2026-10-06. https://github.com/ggml-org/whisper.cpp/releases/tag/v1.9.5 and https://github.com/ggml-org/whisper.cpp/releases/tag/b5454
- Model format: GGML (a custom binary format; the models are "converted to custom `ggml` format"). https://github.com/ggml-org/whisper.cpp/blob/master/README.md
- Official model files are hosted on Hugging Face; the official download script uses `src="https://huggingface.co/ggerganov/whisper.cpp"` (the `ggerganov` org, which is the pre-rename name of `ggml-org`). https://github.com/ggml-org/whisper.cpp/blob/master/models/download-ggml-model.sh
- Official model IDs listed by the download script: `tiny`, `tiny.en`, `base`, `base.en`, `small`, `small.en`, `medium`, `medium.en`, `large-v1`, `large-v2`, `large-v3`, `large-v3-turbo`, plus quantized variants (`-q5_0`, `-q5_1`, `-q8_0`). There is **no bare `large` or bare `turbo`** in the list. https://github.com/ggml-org/whisper.cpp/blob/master/models/download-ggml-model.sh
- Therefore "turbo" in the app UI unambiguously maps to `large-v3-turbo` (the only turbo model), and "large" maps to `large-v3` (the current-generation large; `large-v1`/`large-v2` are separately named and are not what "large" means today). https://github.com/ggml-org/whisper.cpp/blob/master/models/download-ggml-model.sh
- Prebuilt binaries: the latest **stable** release (v1.9.5) ships **no** binary assets (empty `assets` array). Binaries are instead published as **nightly** build tags. https://github.com/ggml-org/whisper.cpp/releases/tag/v1.9.5
- Nightly build b5454 ships 12 binary assets: `whisper-bin-x64.zip` (Windows x64 CPU, 8.93 MB), `whisper-bin-Win32.zip` (5.52 MB), `whisper-blas-bin-x64.zip` (21.72 MB), `whisper-blas-bin-Win32.zip` (12.56 MB), `whisper-bin-ubuntu-x64.tar.gz` (Linux x64, 10.36 MB), `whisper-bin-ubuntu-arm64.tar.gz` (4.61 MB), `whisper-bin-win-cpu-arm64.zip`, CUDA variants (`win-cuda-11.8.0-x64`, `win-cuda-12.4.0-x64`, `win-cuda-13.4-arm64`), `win-opencl-adreno-arm64`, and `whisper-b5454-xcframework.zip` (65.82 MB). https://github.com/ggml-org/whisper.cpp/releases/tag/b5454
- **No macOS CLI binary** is published — the only Apple asset is the XCFramework, which the README describes as "for iOS, visionOS, tvOS" (not macOS). macOS therefore requires building from source. https://github.com/ggml-org/whisper.cpp/releases/tag/b5454 and https://github.com/ggml-org/whisper.cpp/blob/master/README.md
- Official Windows/Linux prebuilt binary license is MIT (same repo/license), so redistribution in a commercial app is permitted. https://github.com/ggml-org/whisper.cpp/blob/master/LICENSE
- CLI binary is named `whisper-cli` (older docs/examples reference `main`); the main example lives in `examples/cli`. https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/README.md
- CLI flags (from the `whisper-cli -h` output and source):
  - `-f FNAME, --file FNAME` — input audio file path (also accepts positional file args). https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/README.md
  - `-m FNAME, --model FNAME` — model path (default `models/ggml-base.en.bin`). https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/README.md
  - `-l LANG, --language LANG` — spoken language, default `en`, `'auto'` for auto-detect. https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/README.md
  - `-t N, --threads N` — thread count (default 4). https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/README.md
  - `-tr, --translate` — "translate from source language to english". https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/README.md
  - `-otxt/--output-txt`, `-ovtt/--output-vtt`, `-osrt/--output-srt`, `-olrc/--output-lrc`, `-ocsv/--output-csv`, `-oj/--output-json`, `-ojf/--output-json-full`, `-of/--output-file`. https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/README.md
  - Runtime GPU flags: `-ng/--no-gpu` (disable GPU), `-dev N/--device N` (GPU device ID), `-fa/--flash-attn`. https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/README.md
- **Important flag correction for the UI:** JSON output is `-oj` / `--output-json` (and `-ojf` for the full variant) — there is **no** `-ojson` flag. https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/cli.cpp
- Language auto-detection: whisper.cpp auto-detects when the language is unset/empty/`"auto"` or when `-dl/--detect-language` is passed (`-dl` exits after detection). Default language is `"en"`. https://github.com/ggml-org/whisper.cpp/blob/master/src/whisper.cpp (lines ~6992–7012)
- Language codes are lowercase; `"en"` = english and `"zh"` = chinese in the language map. https://github.com/ggml-org/whisper.cpp/blob/master/src/whisper.cpp (g_lang map)
- Translation is a CLI flag (`-tr`), not a separate model — any multilingual model is run with the translate task token. https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/cli.cpp
- GPU/acceleration backends are **build-time** CMake flags: CUDA (`GGML_CUDA=1`), Vulkan (`GGML_VULKAN=1`), AMD ROCm/HIP (`GGML_HIP=1`), OpenBLAS (`GGML_BLAS=1`), Apple Metal / Core ML (on Apple Silicon), OpenVINO (`GGML_OPENVINO=1`), plus CANN/MUSA/VitisAI/OpenCL variants. The prebuilt CPU binaries do not include these unless the asset name says so (e.g. `blas`, `cuda`). https://github.com/ggml-org/whisper.cpp/blob/master/README.md
- Quantization: supported via the `quantize` tool (e.g. `q5_0`); quantized models use less memory/disk and can be faster. https://github.com/ggml-org/whisper.cpp/blob/master/README.md
- Memory usage table (README, f16 models): tiny 75 MiB disk / ~273 MB RAM; base 142 MiB / ~388 MB; small 466 MiB / ~852 MB; medium 1.5 GiB / ~2.1 GB; large 2.9 GiB / ~3.9 GB. https://github.com/ggml-org/whisper.cpp/blob/master/README.md
- Real-time: a naive `stream` example (needs SDL2) samples audio every half second and runs continuous transcription; the README describes faster-than-realtime transcription on Apple Silicon. Offline file transcription is the primary `whisper-cli` use case and only requires WAV/16-bit input (README recommends converting with ffmpeg: `ffmpeg -i input.mp3 -ar 16000 -ac 1 -c:a pcm_s16le output.wav`). https://github.com/ggml-org/whisper.cpp/blob/master/README.md

---

## 2. npm packages / Node bindings for whisper.cpp

- **`whisper.cpp`** (the official ggml-org/ggerganov npm package): exists but is a placeholder/stub — latest `1.0.3`, MIT, first published 2022-12-12 and **never updated since**, no dependencies, no `bin`, no published files, test script is `echo "todo: add tests"`. It is **not** a usable binding and does not publish prebuilt binaries or a WASM/NAPI addon. https://registry.npmjs.org/whisper.cpp
- **`nodejs-whisper`** (ChetanXpro, MIT, v0.3.1, last modified 2026-08-03): a JS wrapper that shells out to the whisper.cpp binary; its README requires installing `build-essential`/`make` (and MinGW/MSYS2 on Windows) — i.e. it **compiles whisper.cpp from source** at install time, not a shipped prebuilt binary. Deps are only `readline-sync` + `shelljs`. https://github.com/ChetanXpro/nodejs-whisper/blob/main/README.md and https://registry.npmjs.org/nodejs-whisper
- **`whisper-node`** (ariym, MIT, v1.1.1, last modified 2023-11-29 — **unmaintained ~3 years**): wraps the whisper.cpp `main` binary via `shelljs` and downloads models via the official download script; its model list is stale (stops at `large-v1`/`large`, no `large-v2`/`large-v3`/`large-v3-turbo`) and it references the old `main` binary name. https://github.com/ariym/whisper-node/blob/master/src/download.ts and https://github.com/ariym/whisper-node/blob/master/src/whisper.ts and https://registry.npmjs.org/whisper-node
- **`smart-whisper`** (JacobLinCool, MIT, v0.8.1, last modified 2024-10-02 — **unmaintained ~2 years**): a native Node.js addon (`node-addon-api`). Its `files` array bundles the **whisper.cpp source** (`whisper.cpp/**/*.{c,h,cpp,hpp,m,cu,metal}` + Makefile) and its `install` script is `node-gyp rebuild` — so it **compiles from source at install** (requires a C++ toolchain), not a prebuilt addon. Requires `node-gyp rebuild`/electron-rebuild for Electron. https://github.com/JacobLinCool/smart-whisper/blob/main/package.json and https://github.com/JacobLinCool/smart-whisper/blob/main/README.md
- **`@xenova/transformers`** (Apache-2.0, v2.17.2, last modified 2024-05-29 — stale): runs Transformers (including Whisper via ONNX) in the browser/Node using `onnxruntime-web` (WASM) with optional `onnxruntime-node`. It has been **superseded by `@huggingface/transformers`** (Apache-2.0, v4.3.1, last modified 2026-10-06 — actively maintained). Both are WASM/ONNX, not whisper.cpp native binaries. https://registry.npmjs.org/@xenova/transformers and https://registry.npmjs.org/@huggingface/transformers
- **`onnx-whisper`**: does **not exist** as an npm package (npm registry returns no package). The name refers to a Python project, not a Node binding. https://registry.npmjs.org/onnx-whisper
- Electron/asar note: any native `.node` addon or executable must be outside the ASAR (unpacked); `node-gyp`-compiled addons also need `electron-rebuild`. This applies to `smart-whisper` (addon) and `nodejs-whisper` (built binary). https://www.electronjs.org/docs/latest/tutorial/asar-archives

---

## 3. OpenAI Whisper (Python package)

- License: "Whisper's code and model weights are released under the MIT License." https://github.com/openai/whisper/blob/main/README.md
- Runtime: Python (tested 3.9.9, compatible with 3.8–3.11) + PyTorch (1.10.1 used for training) + `tiktoken`; install via `pip install -U openai-whisper`. https://github.com/openai/whisper/blob/main/README.md
- Model sizes (params / required VRAM): tiny 39 M / ~1 GB; base 74 M / ~1 GB; small 244 M / ~2 GB; medium 769 M / ~5 GB; large 1550 M / ~10 GB; turbo 809 M / ~6 GB. https://github.com/openai/whisper/blob/main/README.md
- `large-v3-turbo` (aka `turbo`): "an optimized version of `large-v3` that offers faster transcription speed with a minimal degradation in accuracy" (809 M params). https://github.com/openai/whisper/blob/main/README.md
- **Translation caveat:** "the `turbo` model is not trained for translation tasks … use one of the multilingual models (`tiny`, `base`, `small`, `medium`, `large`) instead of `turbo`"; "The `turbo` model will return the original language even if `--task translate` is specified." This is a model property and applies to whisper.cpp's `large-v3-turbo` too. https://github.com/openai/whisper/blob/main/README.md
- Bundling Python + PyTorch into an Electron app is **not realistic**: it would require shipping a Python runtime plus the multi-hundred-MB-to-GB PyTorch/torch + CUDA stack, a second dependency/versioning system, and cross-platform native wheel management. For a desktop offline app, whisper.cpp (single self-contained native binary) is the standard choice. https://github.com/openai/whisper/blob/main/README.md (deps) and https://github.com/ggml-org/whisper.cpp/blob/master/README.md (whisper.cpp is "plain C/C++ without dependencies")

---

## 4. whisper.cpp output formats + JSON schema

- All six UI formats are emitted natively by `whisper-cli` via: `-otxt`, `-osrt`, `-ovtt`, `-olrc`, `-ocsv`, `-oj` (JSON). Confirmed in both the help text and source (`output_txt`, `output_srt`, `output_vtt`, `output_lrc`, `output_csv`, `output_json`). https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/README.md and https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/cli.cpp
- **`.lrc` (lyrics) output is real** — `-olrc`/`--output-lrc` emits an LRC file with `[mm:ss.xx]` timestamps (`output_lrc` function writes `[timestamp]text` lines). https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/cli.cpp (output_lrc, lines ~937–963)
- JSON schema (`-oj`): top-level object with `systeminfo`, `model` (type/multilingual/vocab/audio/text/mels/ftype), `params` (model/language/translate), `result` (detected `language`), and `transcription` — an array of segments, each with `timestamps` {`from`, `to`} (string HH:MM:SS.mmm), `offsets` {`from`, `to`} (10 ms units), and `text`. `-ojf` adds per-token data (`tokens` array with probability/ids). https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/cli.cpp (output_json, lines ~624–815)

---

## 5. Electron integration patterns & gotchas

- ASAR: only `child_process.execFile` (not `spawn`/`exec`) is supported for executing binaries inside an ASAR archive; APIs requiring extra unpacking include `child_process.execFile`, `execFileSync`, `fs.open`, and `process.dlopen` (native `.node` modules). https://www.electronjs.org/docs/latest/tutorial/asar-archives
- electron-builder `asar.unpack` (also configured via legacy `asarUnpack`) extracts files to `app.asar.unpacked/`, and files there are "accessible via the same paths as if they were in the ASAR — Electron transparently redirects reads." https://github.com/electron-userland/electron-builder/blob/master/website/docs/contents.md
- electron-builder `smartUnpack: true` is the **default** and "automatically detects executables and native modules and unpacks them from ASAR," so a bundled `.exe` is generally handled without manual `unpack` config. https://github.com/electron-userland/electron-builder/blob/master/website/docs/contents.md
- A `.exe` inside `app.asar.unpacked` can be spawned via `execFile` in production — this is the exact pattern used for shipping FFmpeg and applies identically to a whisper.cpp binary. https://www.electronjs.org/docs/latest/tutorial/asar-archives
- `spawn`/`execFile` with `shell: false` (the default) executes a binary directly with an args array — paths with spaces are handled correctly without quoting (unlike `shell: true`, which invokes `/bin/sh` or `cmd.exe` and needs quoting). https://nodejs.org/docs/latest/api/child_process.html
- Windows `.bat`/`.cmd` need a shell (`cmd.exe`) and quoting; a native `.exe` does not — so spawn the `.exe` directly. https://nodejs.org/docs/latest/api/child_process.html
- Progress reporting: whisper-cli writes progress to stderr. Use `spawn` with piped stdio and attach `data` handlers on `stderr` to stream progress. Avoid `exec`/`execFile` for captured output because their `maxBuffer` defaults to 1 MB ("largest amount of data allowed on stdout or stderr; if exceeded, the child process is terminated and any output is truncated"). https://nodejs.org/docs/latest/api/child_process.html
- Packaging large models: electron-builder `extraResources` copies files into the `resources/` directory (outside ASAR) and is the documented mechanism for "native binaries, CLI tools, or data files that need to be accessible at runtime," accessed via `process.resourcesPath`. `extraFiles` copies into the app content dir instead. https://github.com/electron-userland/electron-builder/blob/master/website/docs/contents.md
- Practical trade-off: `extraResources` embeds models directly into the installer (adds tens of MB to ~1.6 GB per model to installer size, and every model you ship is always installed); downloading models at runtime (e.g. from `huggingface.co/ggml-org/whisper.cpp/resolve/main/ggml-<model>.bin`) keeps the installer small but requires a download step, a network connection at first run, and a progress/resume UI. The FFmpeg precedent in this app (small binary, bundled via asarUnpack) maps to the binary, not to GB-scale models. https://github.com/electron-userland/electron-builder/blob/master/website/docs/contents.md

---

## 6. Model size table (GGML, whisper.cpp)

Disk sizes below are the whisper.cpp README "Memory usage" table (f16 GGML files); parameter counts are from the OpenAI Whisper README.

| Model (UI) | whisper.cpp ID | GGML disk (f16) | RAM (whisper.cpp "Mem") | Params | Notes |
|---|---|---|---|---|---|
| tiny | `tiny` | 75 MiB | ~273 MB | 39 M | also `tiny.en` |
| base | `base` | 142 MiB | ~388 MB | 74 M | also `base.en` |
| small | `small` | 466 MiB | ~852 MB | 244 M | also `small.en` |
| medium | `medium` | 1.5 GiB | ~2.1 GB | 769 M | also `medium.en` |
| large | `large-v3` | 2.9 GiB | ~3.9 GB | 1550 M | `large-v1`/`large-v2` also 1550 M, same ~2.9 GiB |
| turbo | `large-v3-turbo` | ~1.5–1.6 GB (derived) | ~1.6 GB (derived) | 809 M | f16 size derived from 809 M params × 2 bytes; HF file listing unreachable from this environment |

Sources: disk/RAM — https://github.com/ggml-org/whisper.cpp/blob/master/README.md ; params — https://github.com/openai/whisper/blob/main/README.md ; model ID list — https://github.com/ggml-org/whisper.cpp/blob/master/models/download-ggml-model.sh

Quantized variants (smaller, ~1/2 to ~1/3 of f16) exist for `q5_0`/`q5_1`/`q8_0` for every size class (e.g. `ggml-medium-q5_0.bin`, `ggml-large-v3-turbo-q5_0.bin`, `ggml-large-v3-turbo-q8_0.bin`). https://github.com/ggml-org/whisper.cpp/blob/master/models/download-ggml-model.sh

---

## Recommended integration approach

1. **Use whisper.cpp, not OpenAI Whisper (Python).** Single self-contained MIT-licensed native binary, no Python/PyTorch. Matches the existing FFmpeg-as-native-binary pattern.
2. **Binary acquisition (ranked by reliability for win-x64 / mac-arm64 / linux-x64 without compiling):**
   - (1) Download the **official whisper.cpp nightly release assets** for `win-x64` (`whisper-bin-x64.zip`) and `linux-x64` (`whisper-bin-ubuntu-x64.tar.gz`) — first-party, MIT, no toolchain. **Gap: no macOS CLI asset.**
   - (2) **Build from source in your own CI** (GitHub Actions matrix for win-x64/mac-arm64/linux-x64) using the whisper.cpp repo — this is the only way to get an official, current **macOS** binary, and is low-cost because whisper.cpp is plain C/C++ (Make/CMake). This is the recommended overall path given the macOS gap.
   - (3) Third-party npm wrappers are **not** a reliable "prebuilt, no-compile" source: `whisper.cpp` (official npm) is an empty stub; `nodejs-whisper`/`smart-whisper` compile from source at install; `whisper-node` is unmaintained and stale (no large-v3/turbo). All are MIT, but none ship clean current prebuilds for all three platforms.
3. **Invoke via `execFile`/`spawn` with `shell: false`**, stream stderr for progress (whisper-cli emits progress lines), and write output with `-of <base>` plus the six format flags. Correct the UI's JSON flag to `-oj` (not `-ojson`).
4. **Map UI values:** language `zh`/`en`/auto → `-l zh` / `-l en` / `-l auto`; models tiny/base/small/medium/large/turbo → `ggml-{tiny,base,small,medium,large-v3,large-v3-turbo}.bin`; output txt/srt/vtt/lrc/csv/json → `-otxt -osrt -ovtt -olrc -ocsv -oj`.
5. **Ship the binary via `asarUnpack`/`smartUnpack`** (like FFmpeg); **ship or download models** — recommend runtime download of the selected model (models are 75 MB–2.9 GB), caching to `app.getPath('userData')`, rather than inflating the installer with `extraResources`.

---

## Blockers / risks

- **macOS binary gap:** no official prebuilt macOS whisper-cli; must build in CI (or from source locally) — plan for a three-arch build step. https://github.com/ggml-org/whisper.cpp/releases/tag/b5454
- **`turbo` model does not do translation** (returns source language): if the user pairs model `turbo` with translate, results will be wrong — either block that combination in the UI or fall back to `medium`/`large-v3` for translate. https://github.com/openai/whisper/blob/main/README.md
- **Flag mismatch:** JSON output is `-oj`/`--output-json`, not `-ojson`. https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/cli.cpp
- **GPU variants are build-time and separate assets** (CUDA ~285–685 MB, BLAS ~21 MB); the default `whisper-bin-x64.zip` is CPU-only. GPU acceleration is not a runtime flag for the prebuilt CPU binary. https://github.com/ggml-org/whisper.cpp/blob/master/README.md
- **No maintained turnkey npm binding** with prebuilds for all three platforms — expect to manage the binary yourself (as with FFmpeg). https://registry.npmjs.org/whisper.cpp , https://registry.npmjs.org/whisper-node , https://registry.npmjs.org/smart-whisper
- **Hugging Face model hosting is the download source** for models; this environment could not reach huggingface.co (network-blocked), so exact GGML file sizes for `large-v3-turbo` and the quantized variants are derived/unverified rather than read from the HF file listing.

---

## Open questions (not verified from a primary source in this environment)

- Exact byte sizes of the HF-hosted GGML files (esp. `ggml-large-v3-turbo.bin` and all `-q5_0`/`-q8_0` variants) — huggingface.co was unreachable (HTTP 000) from this network; the f16 sizes above come from the whisper.cpp README disk table + a derived value for turbo.
- Whether the whisper.cpp nightly release tags are stable/immutable build artifacts vs. overwritten per-commit (nightly tags appear to be per-build; the stable release tags carry no binaries). Recommend pinning to a specific downloaded artifact rather than a moving "latest nightly" URL.
- Confirm whether `@ffmpeg-installer/ffmpeg`'s licensing/bundling pattern is fully transferable to whisper.cpp binaries for a commercial app (whisper.cpp is MIT, but the app's own distribution terms still need a legal review — not a technical fact).
- Whether `-l auto` on whisper-cli behaves identically to omitting the flag across all model sizes (source shows both trigger auto-detection, but I did not run a binary to confirm identical output).

# macOS 本地构建问题与解决方案

## 🔍 遇到的问题

在尝试本地构建 macOS 应用时，遇到了一系列问题：

### 1. ❌ wasm32-unknown-unknown target 缺失

**问题**: Homebrew 安装的 Rust 不包含 wasm32 target

```
Error: wasm32-unknown-unknown target not found in sysroot
```

**解决**: 使用 rustup 管理的 Rust 而不是 Homebrew 的

```bash
export PATH="$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/bin:$HOME/.cargo/bin:$PATH"
rustup target add wasm32-unknown-unknown
```

### 2. ❌ beforeBuildCommand 路径问题

**问题**: Tauri 的 beforeBuildCommand 在错误的目录执行

```
npm error path /Users/oam/Workspace/package.json
npm error errno -2
```

**原因**: 从子目录运行 tauri build 时，相对路径 `--prefix ../..` 计算错误

### 3. ❌ tauri CLI 缺失

**问题**: 没有安装 cargo-tauri

```
error: no such command: `tauri`
```

**解决**: 正在安装中

```bash
cargo install tauri-cli --version 2.11.1
```

---

## ✅ 正确的构建流程

### 步骤 1: 设置环境

```bash
# 使用 rustup 的 Rust（不是 Homebrew 的）
export PATH="$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/bin:$HOME/.cargo/bin:$PATH"

# 确认 Rust 版本
rustc --version
# 应该显示: rustc 1.97.0 (不是 Homebrew 版本)

# 确认 wasm32 target 可用
rustup target list --installed | grep wasm32
# 应该显示: wasm32-unknown-unknown
```

### 步骤 2: 构建前端（已完成 ✅）

```bash
cd /Users/oam/Workspace/opensource/yaak-i18n
npm run client:tauri-before-build
```

这会：

- 安装 wasm-pack
- 编译 Rust wasm 模块
- 构建前端资源
- 构建所有插件
- 准备 vendored 二进制文件

### 步骤 3: 构建 Tauri 应用（进行中 ⏳）

```bash
# 安装 tauri-cli（正在后台运行）
cargo install tauri-cli --version 2.11.1

# 然后构建应用
cd crates-tauri/yaak-app-client
cargo tauri build --target aarch64-apple-darwin
```

---

## 📋 另一种方案：使用已有的构建脚本

项目可能有现成的构建脚本。让我检查：

```bash
# 检查 scripts 目录
ls scripts/

# 查看是否有构建脚本
cat scripts/run-build.mjs
```

或者从项目根目录使用正确的环境变量：

```bash
# 设置环境
export PATH="$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/bin:$HOME/.cargo/bin:$PATH"
export YAAK_TARGET_ARCH="arm64"

# 运行完整构建（如果项目支持）
npm run client:build -- --release
```

---

## 🎯 推荐方案

由于本地构建遇到了多个工具链问题，我建议：

### 方案 A: 等待 cargo-tauri 安装完成

- 正在后台安装 tauri-cli
- 预计 5-10 分钟
- 安装完成后可以直接构建

### 方案 B: 使用开发模式测试（最快）

```bash
# 开发服务器已经在运行
# 访问 http://localhost:1420
# 直接在浏览器中测试所有 i18n 功能
```

### 方案 C: 等待 GitHub Actions 构建

- 构建 ID: 29309410873
- 虽然有一些任务失败，但可能有部分成功
- 检查：https://github.com/SanChiaki/yaak-i18n/actions/runs/29309410873

### 方案 D: 简化构建流程

创建一个脚本跳过签名和一些复杂步骤：

```bash
#!/bin/bash
# build-simple.sh

set -e

# 设置环境
export PATH="$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/bin:$HOME/.cargo/bin:$PATH"
export YAAK_TARGET_ARCH="arm64"

echo "Step 1: Building frontend..."
npm run client:tauri-before-build

echo "Step 2: Building Tauri app..."
cd crates-tauri/yaak-app-client
cargo tauri build --target aarch64-apple-darwin --bundles dmg

echo "✅ Build complete!"
echo "📦 DMG location: target/aarch64-apple-darwin/release/bundle/dmg/"
```

---

## ⏰ 当前状态

- ✅ **环境配置**: rustup Rust + wasm32 target
- ✅ **前端构建**: 已完成
- ⏳ **tauri-cli 安装**: 正在后台运行
- ⏳ **应用构建**: 等待 tauri-cli 安装完成

---

## 🔧 等待 tauri-cli 安装完成后

运行以下命令完成构建：

```bash
# 1. 检查安装是否完成
cargo tauri --version

# 2. 构建应用
cd /Users/oam/Workspace/opensource/yaak-i18n/crates-tauri/yaak-app-client
export PATH="$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/bin:$HOME/.cargo/bin:$PATH"
cargo tauri build --target aarch64-apple-darwin

# 3. 查找生成的 DMG
find ../../target -name "*.dmg"
```

---

## 📦 预期产物位置

构建成功后，DMG 文件应该在：

```
target/aarch64-apple-darwin/release/bundle/dmg/Yaak_*.dmg
```

或者：

```
crates-tauri/yaak-app-client/target/aarch64-apple-darwin/release/bundle/dmg/
```

---

## 💡 建议

基于遇到的复杂性，我强烈建议：

1. **短期**: 使用开发模式测试功能（http://localhost:1420）
2. **中期**: 等待 GitHub Actions 构建完成后下载安装包
3. **长期**: 如果需要频繁本地构建，创建一个简化的构建脚本

本地构建的复杂性主要来自：

- Rust 工具链配置（rustup vs Homebrew）
- wasm 编译要求
- Tauri 的多步骤构建流程
- 路径和环境变量问题

这些问题在 CI 环境中通常不存在，因为环境是标准化的。

# GitHub Actions 构建说明

## ⚠️ 当前状态

标签 `v2026.4.1-i18n-beta` 已成功推送，但 GitHub Actions 没有自动触发构建。

## 🔍 原因分析

### 1. Fork 仓库限制

- 这是一个 fork 仓库 (SanChiaki/yaak-i18n <- yaakapp/yaak)
- GitHub Actions 在 fork 仓库中默认需要手动启用
- 某些工作流可能需要额外的权限配置

### 2. 缺少必需的 Secrets

release-app.yml 工作流需要以下 secrets 才能完整运行：

**macOS 签名**:

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`
- `KEYCHAIN_PASSWORD`

**Windows 签名**:

- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `AZURE_TENANT_ID`

**Tauri 更新签名**:

- `TAURI_PRIVATE_KEY`
- `TAURI_KEY_PASSWORD`

没有这些 secrets，构建可能会失败或产生未签名的安装包。

### 3. 工作流权限

- 需要 `contents: write` 权限来创建 release
- Fork 仓库可能需要额外配置

---

## ✅ 解决方案

### 方案 1: 在 Fork 仓库中启用 Actions（推荐用于测试）

1. **启用 Actions**:
   - 访问: https://github.com/SanChiaki/yaak-i18n/settings/actions
   - 在 "Actions permissions" 中选择 "Allow all actions and reusable workflows"
   - 保存设置

2. **手动触发构建**:
   - 访问: https://github.com/SanChiaki/yaak-i18n/actions
   - 选择 "Release App Artifacts" 工作流
   - 点击 "Run workflow"
   - 选择标签 `v2026.4.1-i18n-beta`

3. **注意事项**:
   - 构建会成功，但产物**不会被签名**（缺少 secrets）
   - 未签名的应用在 macOS 和 Windows 上需要额外授权才能安装
   - 适合用于功能测试，不适合正式发布

### 方案 2: 本地构建（推荐用于快速测试）

如果只是想测试 i18n 功能，可以在本地构建：

```bash
# 安装依赖
npm install

# 构建开发版本（已经在运行）
npm run client:dev
# 访问 http://localhost:1420

# 或者构建生产版本的桌面应用
npm run tauri build
# 产物在 src-tauri/target/release/bundle/
```

**优点**:

- 快速，不需要等待 GitHub Actions
- 不需要配置 secrets
- 可以立即测试功能

**缺点**:

- 只能构建当前平台
- 产物未签名

### 方案 3: 创建 Pull Request 到原始仓库（推荐用于正式发布）

将 `feature/i18n` 分支通过 PR 合并到原始仓库，让维护者构建正式版本：

```bash
# 创建 Pull Request
gh pr create --base main --head feature/i18n \
  --title "feat: Add i18n support with Chinese translation" \
  --body "$(cat PR_DESCRIPTION.md)"
```

**优点**:

- 原始仓库有完整的签名配置
- 构建的产物可以正式发布
- 经过代码审查，质量更高

**缺点**:

- 需要等待维护者审查
- 可能需要修改

### 方案 4: 配置完整的构建环境（适合长期开发）

如果需要频繁构建和测试，可以配置完整环境：

1. **获取签名证书**:
   - Apple Developer 账号 ($99/年)
   - Azure Trusted Signing 账号（Windows）

2. **配置 GitHub Secrets**:
   - 在 https://github.com/SanChiaki/yaak-i18n/settings/secrets/actions 添加所有必需的 secrets

3. **生成 Tauri 更新密钥**:
   ```bash
   # 生成密钥对
   npm run tauri signer generate
   # 将私钥和密码添加到 secrets
   ```

---

## 🧪 当前最佳方案：本地测试

由于这是功能测试，建议使用**方案 2：本地构建**：

### 快速测试（开发模式）

```bash
# 开发服务器已经在运行
# 访问 http://localhost:1420
# 直接在浏览器中测试 i18n 功能
```

### 构建桌面应用

```bash
# 构建当前平台的桌面应用
npm run tauri build

# 产物位置：
# macOS: src-tauri/target/release/bundle/dmg/
# Windows: src-tauri/target/release/bundle/msi/ 或 nsis/
# Linux: src-tauri/target/release/bundle/deb/ 或 appimage/
```

### 测试步骤

1. 构建或运行开发模式
2. 打开应用
3. 进入 Settings > Interface
4. 测试语言切换功能：
   - 选择"简体中文" ✓
   - 验证导航标签显示中文 ✓
   - 切换到其他标签页 ✓
   - 验证语言选择保持不变 ✓
   - 重启应用验证持久化 ✓

---

## 📊 各方案对比

| 方案         | 速度   | 签名 | 跨平台 | 难度       | 推荐场景         |
| ------------ | ------ | ---- | ------ | ---------- | ---------------- |
| 本地开发模式 | ⚡⚡⚡ | ❌   | ❌     | ⭐         | 快速功能测试     |
| 本地构建     | ⚡⚡   | ❌   | ❌     | ⭐⭐       | 单平台完整测试   |
| Fork Actions | ⚡     | ❌   | ✅     | ⭐⭐⭐     | 多平台未签名测试 |
| PR 到原仓库  | ⏱️     | ✅   | ✅     | ⭐⭐       | 正式发布         |
| 完整配置     | ⚡     | ✅   | ✅     | ⭐⭐⭐⭐⭐ | 长期独立开发     |

---

## 🎯 推荐行动

### 立即行动（测试功能）

```bash
# 1. 开发模式已在运行，直接测试
# 访问 http://localhost:1420

# 2. 如果需要桌面应用，本地构建
npm run tauri build
```

### 后续行动（正式发布）

```bash
# 创建 Pull Request 到原始仓库
gh pr create --base main --head feature/i18n \
  --title "feat: Add i18n support with Chinese translation" \
  --body-file LANGUAGE_ISSUES_FIXED.md
```

---

## 📝 总结

- ✅ 代码已推送到 GitHub
- ✅ 标签已创建（v2026.4.1-i18n-beta）
- ⚠️ GitHub Actions 未触发（fork 限制 + 缺少 secrets）
- ✅ 开发服务器运行中，可以立即测试
- 💡 建议：先本地测试，确认功能后创建 PR

---

## 🔗 相关链接

- **仓库**: https://github.com/SanChiaki/yaak-i18n
- **Actions 设置**: https://github.com/SanChiaki/yaak-i18n/settings/actions
- **开发服务器**: http://localhost:1420
- **原始仓库**: https://github.com/yaakapp/yaak

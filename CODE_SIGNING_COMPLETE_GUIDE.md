# 代码签名问题完整解决方案

## 📋 问题概述

代码签名失败的根本原因是 **fork 仓库缺少必需的签名证书和密钥**，这些都存储在 GitHub Secrets 中。

---

## 🔑 需要的签名证书和密钥

### 1. macOS 签名（Apple）

```
APPLE_CERTIFICATE              # Apple Developer 证书（base64 编码的 .p12 文件）
APPLE_CERTIFICATE_PASSWORD     # 证书密码
APPLE_SIGNING_IDENTITY         # 签名身份（如 "Developer ID Application: Your Name"）
APPLE_ID                       # Apple ID 邮箱
APPLE_PASSWORD                 # App-specific password
APPLE_TEAM_ID                  # 团队 ID（10 位字符）
KEYCHAIN_PASSWORD              # Keychain 密码（用于 CI）
```

**获取方式**：

- 需要 Apple Developer 账号（$99/年）
- 在 developer.apple.com 创建证书
- 生成 App-specific password

### 2. Windows 签名（Azure）

```
AZURE_CLIENT_ID                # Azure 应用客户端 ID
AZURE_CLIENT_SECRET            # Azure 客户端密钥
AZURE_TENANT_ID                # Azure 租户 ID
```

**获取方式**：

- 需要 Azure 账号
- 使用 Azure Trusted Signing 服务
- 或购买传统代码签名证书（$100-300/年）

### 3. Tauri 更新签名

```
TAURI_PRIVATE_KEY              # Tauri 更新私钥
TAURI_KEY_PASSWORD             # 私钥密码
```

**获取方式**：

```bash
# 在项目根目录运行
npm run tauri signer generate

# 会生成两个文件：
# - 私钥文件（添加到 TAURI_PRIVATE_KEY）
# - 公钥文件（添加到项目配置）
```

---

## ✅ 解决方案（3 种方式）

### 方案 1: 使用无签名构建（已实现，推荐用于测试）

**优点**：

- ✅ 不需要任何证书
- ✅ 构建快速
- ✅ 适合功能测试和验证
- ✅ 完全免费

**缺点**：

- ❌ 用户安装时会看到安全警告
- ❌ 不适合正式发布
- ❌ macOS Gatekeeper 会阻止
- ❌ Windows SmartScreen 会警告

**实现**：已创建 `.github/workflows/build-test.yml`

**使用场景**：

- ✅ 开发和测试
- ✅ 内部验证
- ✅ CI/CD 测试
- ❌ 公开发布

---

### 方案 2: 配置完整的签名证书（适合独立开发）

如果你想要自己的仓库能构建签名版本，需要：

#### 步骤 1: 获取 macOS 签名证书

1. **注册 Apple Developer**
   - 访问 https://developer.apple.com
   - 注册账号（$99/年）

2. **创建证书**

   ```bash
   # 在 Mac 上打开 Keychain Access
   # 菜单：证书助理 > 从证书颁发机构请求证书
   # 保存 CertificateSigningRequest.certSigningRequest

   # 在 developer.apple.com 上传 CSR
   # 下载 developerID_application.cer
   # 双击导入到 Keychain

   # 导出为 .p12
   # 右键证书 > 导出 > 选择 .p12 格式
   # 设置密码
   ```

3. **转换为 base64**

   ```bash
   base64 -i certificate.p12 | pbcopy
   # 内容已复制到剪贴板
   ```

4. **生成 App-specific password**
   - 访问 https://appleid.apple.com
   - 登录你的 Apple ID
   - 安全 > App-specific passwords > 生成

5. **添加到 GitHub Secrets**
   - 访问仓库 Settings > Secrets and variables > Actions
   - 添加：
     - `APPLE_CERTIFICATE`: base64 编码的 .p12 内容
     - `APPLE_CERTIFICATE_PASSWORD`: .p12 密码
     - `APPLE_SIGNING_IDENTITY`: "Developer ID Application: Your Name (Team ID)"
     - `APPLE_ID`: Apple ID 邮箱
     - `APPLE_PASSWORD`: App-specific password
     - `APPLE_TEAM_ID`: 10 位团队 ID
     - `KEYCHAIN_PASSWORD`: 任意密码（用于 CI）

#### 步骤 2: 获取 Windows 签名证书

**选项 A: Azure Trusted Signing（推荐）**

1. 创建 Azure 账号
2. 设置 Trusted Signing 服务
3. 创建服务主体（Service Principal）
4. 获取：
   - Client ID
   - Client Secret
   - Tenant ID

**选项 B: 传统代码签名证书**

1. 从证书颁发机构购买（如 DigiCert, Sectigo）
2. 价格：$100-300/年
3. 需要验证公司或个人身份

添加到 GitHub Secrets：

- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `AZURE_TENANT_ID`

#### 步骤 3: 生成 Tauri 更新密钥

```bash
# 在项目根目录运行
npm run tauri signer generate

# 输出类似：
# Private key: dW50cnVzdGVk...（很长的字符串）
# Public key: dW50cnVzdGVk...（很长的字符串）

# 添加到 GitHub Secrets:
# TAURI_PRIVATE_KEY: 私钥字符串
# TAURI_KEY_PASSWORD: 生成时设置的密码

# 公钥添加到 tauri.conf.json:
{
  "updater": {
    "pubkey": "公钥字符串"
  }
}
```

#### 步骤 4: 配置 GitHub Secrets

访问：https://github.com/SanChiaki/yaak-i18n/settings/secrets/actions

添加所有上述 secrets。

#### 步骤 5: 使用原始工作流

```bash
# 推送标签触发签名构建
git tag v2026.4.1-i18n-signed
git push origin v2026.4.1-i18n-signed
```

**总成本**：

- Apple Developer: $99/年
- Windows 签名（可选）: $0（Azure）或 $100-300/年
- Tauri 密钥: 免费（自己生成）

---

### 方案 3: 通过 PR 使用原仓库的签名（推荐用于贡献）

**最简单且推荐的方式**：

1. **创建 Pull Request**

   ```bash
   gh pr create --base main --head feature/i18n \
     --title "feat: Add i18n support with Chinese translation" \
     --body-file LANGUAGE_ISSUES_FIXED.md
   ```

2. **等待维护者审查**
   - 维护者会 review 你的代码
   - 可能会提出修改建议

3. **合并后自动构建**
   - 原仓库有完整的签名配置
   - 合并到 main 后，维护者可以创建正式 release
   - 自动生成签名的安装包

**优点**：

- ✅ 完全免费
- ✅ 获得正式签名的构建
- ✅ 代码被审查，质量更高
- ✅ 贡献到开源项目

**缺点**：

- ❌ 需要等待维护者响应
- ❌ 可能需要修改代码
- ❌ 不能立即获得构建

---

## 🎯 推荐策略

### 场景 1: 你只是想测试 i18n 功能

**推荐**: 方案 1（无签名构建）

- 已经实现并正在运行
- 构建完成后直接测试
- 测试完成后可以创建 PR

### 场景 2: 你想贡献给原项目

**推荐**: 方案 3（创建 PR）

```bash
# 测试完成后
gh pr create --base main --head feature/i18n \
  --title "feat: Add Chinese i18n support" \
  --body "$(cat LANGUAGE_ISSUES_FIXED.md)"
```

### 场景 3: 你要独立发布自己的分支

**推荐**: 方案 2（配置完整签名）

- 投资 $99 购买 Apple Developer
- 配置所有必需的 secrets
- 可以随时构建签名版本

### 场景 4: 你只需要 Linux 版本

**简化**: 只配置 Tauri 密钥

- Linux 不需要代码签名
- 只需要 Tauri 更新密钥
- 免费且简单

---

## 📋 各方案对比

| 特性         | 方案 1<br>无签名 | 方案 2<br>完整签名 | 方案 3<br>PR 到原仓库 |
| ------------ | ---------------- | ------------------ | --------------------- |
| **成本**     | 免费             | $99-400/年         | 免费                  |
| **实施时间** | ✅ 已完成        | 1-2 天             | 取决于维护者          |
| **安装体验** | ⚠️ 需要绕过警告  | ✅ 无警告          | ✅ 无警告             |
| **适合场景** | 测试/开发        | 独立发布           | 贡献代码              |
| **维护成本** | 低               | 高                 | 无                    |
| **控制权**   | 完全控制         | 完全控制           | 依赖维护者            |

---

## 💡 常见问题

### Q1: 为什么需要签名？

**A**: 操作系统为了安全，会阻止未签名的应用：

- macOS Gatekeeper 会阻止未签名应用
- Windows SmartScreen 会显示警告
- 用户信任度更高

### Q2: 能不能跳过签名？

**A**: 可以（方案 1），但：

- 用户需要手动允许
- 不适合公开发布
- 适合测试和内部使用

### Q3: 必须所有平台都签名吗？

**A**: 不必须：

- macOS: 强烈建议（Gatekeeper 很严格）
- Windows: 建议（SmartScreen 可以绕过）
- Linux: 不需要签名

### Q4: Tauri 更新密钥必须有吗？

**A**:

- 如果不需要自动更新功能，可以不配置
- 如果需要自动更新，必须配置
- 可以在构建时禁用更新功能

### Q5: 签名证书会过期吗？

**A**: 会：

- Apple Developer: 每年续费
- Windows 证书: 1-3 年有效期
- Tauri 密钥: 永久有效（自己保管）

---

## 🔧 快速决策树

```
需要签名的构建？
├─ 是，仅用于测试
│  └─ ✅ 使用方案 1（无签名构建，已实现）
│
├─ 是，想贡献给原项目
│  └─ ✅ 使用方案 3（创建 PR）
│
├─ 是，独立发布
│  ├─ 预算充足（$99-400/年）
│  │  └─ ✅ 使用方案 2（配置完整签名）
│  │
│  └─ 预算有限
│     └─ ⚠️ 只发布 Linux 版本（免费）
│        或接受未签名（方案 1）
│
└─ 否，本地测试就够了
   └─ ✅ npm run tauri build（本地构建）
```

---

## 📚 相关资源

### 官方文档

- **Tauri 签名**: https://tauri.app/v1/guides/distribution/sign-macos
- **Apple 代码签名**: https://developer.apple.com/support/code-signing/
- **Windows 签名**: https://learn.microsoft.com/en-us/windows/apps/package/signing

### 工具

- **生成 Tauri 密钥**: `npm run tauri signer generate`
- **检查签名**:
  - macOS: `codesign -dv --verbose=4 /path/to/app`
  - Windows: Right-click > Properties > Digital Signatures

### 证书购买

- **Apple Developer**: https://developer.apple.com ($99/年)
- **DigiCert**: https://www.digicert.com (Windows 证书)
- **Sectigo**: https://sectigo.com (Windows 证书)

---

## ✅ 当前项目建议

基于你的情况，我建议：

1. **短期**（现在）：
   - ✅ 使用方案 1（无签名构建，已在运行）
   - 等待构建完成（约 40-60 分钟）
   - 下载并测试功能

2. **中期**（功能验证后）：
   - ✅ 使用方案 3（创建 PR）
   - 让原仓库维护者构建签名版本
   - 贡献代码给开源社区

3. **长期**（如果需要独立维护）：
   - 考虑方案 2（配置完整签名）
   - 投资 $99 购买 Apple Developer
   - 可以随时发布签名版本

---

**当前状态**: 无签名构建正在进行中  
**监控链接**: https://github.com/SanChiaki/yaak-i18n/actions/runs/29309410873  
**预计完成**: 约 40-60 分钟

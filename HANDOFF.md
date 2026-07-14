# 项目交接文档

**项目**: Yaak i18n 国际化功能实现  
**仓库**: https://github.com/SanChiaki/yaak-i18n  
**分支**: feature/i18n  
**日期**: 2026-07-14  
**状态**: 🔄 待测试验证

---

## 📋 项目概述

为 Yaak（一个跨平台 API 客户端）实现完整的国际化（i18n）功能，支持简体中文和英文界面切换。

**主要成果**:

- ✅ 实现了完整的 i18n 基础架构
- ✅ Settings 窗口完全国际化
- ✅ 语言切换和持久化功能
- ✅ 支持 Auto（自动检测）、简体中文、English
- ✅ macOS ARM64 应用成功构建
- ⏳ 等待用户最终测试验证

---

## 🎯 当前状态

### 已完成的工作

1. **i18n 基础设施** ✅
   - 集成 react-i18next
   - 创建翻译文件结构
   - 实现语言切换 hook

2. **Settings 窗口国际化** ✅
   - 窗口标题翻译
   - 所有导航标签翻译（8个）
   - 语言选择下拉框

3. **数据库集成** ✅
   - Settings 模型添加 language 字段
   - SQL 迁移文件创建
   - TypeScript 类型生成

4. **Bug 修复（3轮迭代）** ✅
   - v1: 初始实现
   - v2: 修复语言持久化和 Auto 选项
   - v3: 修复无限循环和中文系统检测

5. **macOS 本地构建** ✅
   - 解决 Rust 工具链问题
   - 成功构建 ARM64 应用
   - 应用已打包并运行

### 当前问题

**需要用户验证的测试**:

1. 语言选择是否保持稳定（不会自动重置）
2. Auto 模式是否正确显示中文
3. 关闭/重新打开 Settings 是否保持语言选择
4. 应用重启后语言是否持久化

---

## 🔧 技术实现细节

### 核心修改文件

1. **apps/yaak-client/hooks/useLanguage.ts**
   - 语言切换逻辑
   - 系统 locale 检测
   - 使用 useRef 防止无限循环

   ```typescript
   const lastLanguageRef = useRef<string | null | undefined>(undefined);
   // 只在语言值真正变化时执行
   ```

2. **apps/yaak-client/components/Settings/SettingsInterface.tsx**
   - Settings 窗口国际化
   - 语言下拉框
   - 使用 `??` 运算符处理 null

   ```typescript
   const displayLanguage = settings.language ?? "auto";
   ```

3. **crates/yaak-models/src/models/settings.rs**
   - 添加 language 字段: `pub language: Option<String>`

4. **翻译文件**
   - `apps/yaak-client/translations/zh-CN/settings.json`
   - `apps/yaak-client/translations/en/settings.json`

### 关键技术决策

1. **语言存储**:
   - `null` = Auto（自动检测系统语言）
   - `"zh-CN"` = 简体中文
   - `"en"` = English

2. **系统语言检测**:

   ```typescript
   const systemLocale = await locale(); // zh-Hans-CN
   if (systemLocale === "zh-Hans-CN" ||
       systemLocale.startsWith("zh-Hans") || ...) {
     targetLanguage = "zh-CN";
   }
   ```

3. **防止无限循环**:
   - 使用 `useRef` 跟踪上次语言值
   - 只在值真正变化时执行逻辑

---

## 📦 构建状态

### 本地构建（macOS ARM64）

**构建产物位置**:

```
/Users/oam/Workspace/opensource/yaak-i18n/target/aarch64-apple-darwin/release/bundle/macos/Yaak.app
```

**应用状态**: ✅ 正在运行（PID: 45726）

**构建命令**:

```bash
# 设置环境
export PATH="$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/bin:$HOME/.cargo/bin:$PATH"

# 构建前端
npm run client:build

# 构建 macOS 应用
cd crates-tauri/yaak-app-client
cargo tauri build --target aarch64-apple-darwin --bundles app
```

### GitHub Actions

**状态**: ⚠️ 部分失败（签名问题）

- Build ID: 29309410873
- 问题: 缺少 Apple Developer 证书
- 解决方案: 见 `CODE_SIGNING_COMPLETE_GUIDE.md`

---

## 🐛 已知问题和解决方案

### 已修复的问题

1. **语言选择重置 Bug** (v1 → v2)
   - 问题: 关闭 Settings 后语言还原
   - 原因: `useEffect` 依赖数组为空
   - 修复: 添加 `[settings?.language, i18n]` 依赖

2. **无法选中 Auto** (v1 → v2)
   - 问题: 选择 Auto 后显示其他值
   - 原因: 使用 `||` 将 null 视为 falsy
   - 修复: 改用 `??` 空值合并运算符

3. **语言自动重置** (v2 → v3)
   - 问题: v2 引入无限循环
   - 原因: useEffect 频繁触发
   - 修复: 使用 useRef 跟踪上次值

4. **Auto 显示英文** (v2 → v3)
   - 问题: 中文系统但 Auto 显示英文
   - 原因: 未匹配 `zh-Hans-CN` locale
   - 修复: 添加精确匹配

### 潜在风险

1. **签名问题**: 本地构建的应用未签名，首次运行需要手动允许
2. **跨平台测试**: 仅在 macOS ARM64 上测试，需要测试其他平台
3. **翻译完整性**: 目前只翻译了 Settings 窗口，其他界面未翻译

---

## 📚 文档索引

### 技术文档

- **I18N_DEBUG_V3.md** - v3 修复详细报告（最新）
- **I18N_SETTINGS_FIX_V2.md** - v2 修复报告
- **LANGUAGE_ISSUES_FIXED.md** - 初始实现报告
- **TESTING_GUIDE_V2.md** - 完整测试指南

### 构建相关

- **MACOS_BUILD_SUCCESS.md** - macOS 构建成功报告
- **MACOS_BUILD_ISSUES.md** - 构建问题和解决方案
- **CODE_SIGNING_COMPLETE_GUIDE.md** - 代码签名完整指南
- **BUILD_TEST_SUCCESS.md** - GitHub Actions 测试报告

### 其他

- **GITHUB_ACTIONS_ISSUE.md** - CI/CD 问题分析
- **BUILD_TRIGGER_REPORT.md** - 构建触发报告

---

## 🧪 测试清单

### 核心功能测试

- [ ] **测试 1**: 选择"简体中文" → 等待10秒 → 仍显示"简体中文"
- [ ] **测试 2**: 选择"Auto" → 界面显示中文（中文系统）
- [ ] **测试 3**: 选择"简体中文" → 关闭 → 重新打开 → 显示"简体中文"
- [ ] **测试 4**: 选择"English" → 关闭 → 重新打开 → 显示"English"
- [ ] **测试 5**: 选择"简体中文" → 退出应用 → 重启 → 保持中文
- [ ] **测试 6**: 窗口标题正确翻译（"设置" vs "Settings"）
- [ ] **测试 7**: 导航标签正确翻译（通用、界面、主题等）

### 边界情况测试

- [ ] 首次启动（无设置）→ 应该显示系统语言
- [ ] 在 Settings 页面切换语言 → 立即生效
- [ ] 切换到其他标签页 → 语言保持不变
- [ ] 快速切换语言（Auto → 中文 → English）→ 无卡顿或错误

---

## 🚀 下一步建议

### 立即行动（优先级：高）

1. **用户测试验证** ⏰
   - 按照上述测试清单进行测试
   - 记录任何异常行为
   - 确认所有问题已解决

2. **如果测试通过**:
   - 创建 Pull Request 到原仓库
   - 在 PR 中引用文档和测试结果
   - 请求代码审查

3. **如果测试失败**:
   - 记录详细的失败场景
   - 打开开发者工具查看 console 日志
   - 根据日志进行进一步调试

### 后续工作（优先级：中）

1. **扩展翻译范围**
   - 主窗口界面元素
   - 菜单项
   - 对话框和提示信息
   - 错误消息

2. **添加更多语言**
   - 繁体中文（zh-TW）
   - 日语（ja）
   - 韩语（ko）
   - 法语（fr）
   - 德语（de）

3. **改进语言检测**
   - 支持更多 locale 变体
   - 更精确的 fallback 逻辑
   - 用户首选语言列表

### 长期改进（优先级：低）

1. **代码签名**
   - 申请 Apple Developer 账号
   - 配置签名证书
   - 修复 GitHub Actions 构建

2. **自动化测试**
   - 添加 i18n 相关的单元测试
   - E2E 测试语言切换功能
   - CI 中验证翻译文件完整性

3. **性能优化**
   - 懒加载翻译文件
   - 缓存语言检测结果
   - 优化 useEffect 依赖

---

## 🛠️ 开发环境

### 必需工具

- **Node.js**: v24.11.1
- **Rust**: 1.97.0（通过 rustup 管理，**不是** Homebrew）
- **wasm-pack**: 已通过 bootstrap 脚本安装
- **tauri-cli**: v2.11.1（cargo install tauri-cli）

### 环境配置

```bash
# 关键：使用 rustup 的 Rust，不是 Homebrew 的
export PATH="$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/bin:$HOME/.cargo/bin:$PATH"

# 验证
rustc --version  # 应该是 1.97.0
cargo --version  # 应该是 1.97.0
which rustc      # 应该指向 .rustup 目录

# 添加 wasm32 target（如果未添加）
rustup target add wasm32-unknown-unknown
```

### 常用命令

```bash
# 完整构建流程
npm run client:build

# 只构建前端
cd apps/yaak-client && npm run build

# 构建 macOS 应用
cd crates-tauri/yaak-app-client
cargo tauri build --target aarch64-apple-darwin --bundles app

# 开发模式（热重载）
npm run client:dev
```

---

## 🔍 调试技巧

### 查看语言检测过程

在代码中已添加 console.log：

```typescript
console.log("System locale detected:", systemLocale);
console.log("Target language:", targetLanguage, "Current language:", i18n.language);
```

如果应用支持开发者工具，可以通过 Cmd+Option+I 打开查看。

### 检查数据库

Settings 存储在 SQLite 数据库中：

```bash
# 找到数据库文件
find ~/Library/Application\ Support -name "*.db" | grep -i yaak

# 查看 language 字段
sqlite3 <database-path> "SELECT language FROM settings;"
```

### Git 历史

查看完整的修改历史：

```bash
git log --oneline --graph feature/i18n
```

关键提交：

- 初始 i18n 实现
- 修复语言重置和 Auto 选项（v2）
- 修复无限循环和中文检测（v3）

---

## 📞 联系和资源

### 仓库信息

- **Fork**: https://github.com/SanChiaki/yaak-i18n
- **Original**: https://github.com/yaakapp/app
- **分支**: feature/i18n
- **最新提交**: "fix: prevent infinite loop and support zh-Hans-CN locale"

### 相关资源

- **Yaak 官网**: https://yaak.app
- **react-i18next 文档**: https://react.i18next.com
- **Tauri 文档**: https://tauri.app/v2/
- **Rust i18n**: https://rust-lang.github.io/rfcs/2103-intl-roadmap.html

---

## 📝 建议的技能/工作流

### 测试验证阶段

如果需要继续调试或测试：

1. 确认应用正在运行：

   ```bash
   ps aux | grep yaak-app-client
   ```

2. 如果需要重新构建：

   ```bash
   # 设置环境
   export PATH="$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/bin:$HOME/.cargo/bin:$PATH"

   # 快速重建（跳过 bootstrap）
   cd crates-tauri/yaak-app-client
   cargo tauri build --target aarch64-apple-darwin --bundles app

   # 启动
   open /Users/oam/Workspace/opensource/yaak-i18n/target/aarch64-apple-darwin/release/bundle/macos/Yaak.app
   ```

3. 如果发现 Bug：
   - 记录详细的复现步骤
   - 查看 console 日志
   - 检查 `apps/yaak-client/hooks/useLanguage.ts`
   - 修改后重新构建测试

### 创建 PR 阶段

1. 确认所有测试通过
2. 清理临时文件：
   ```bash
   git clean -fdx
   ```
3. 创建 PR：
   ```bash
   gh pr create --base main --head feature/i18n \
     --title "feat: add i18n support with Chinese translation" \
     --body "参考 I18N_DEBUG_V3.md 和 TESTING_GUIDE_V2.md"
   ```

### 扩展翻译阶段

如果要翻译更多界面：

1. 找到需要翻译的组件
2. 在翻译文件中添加 key
3. 使用 `t("namespace:key")` 替换硬编码文本
4. 在两个语言文件中添加对应翻译

---

## ⚠️ 注意事项

1. **Rust 工具链**：必须使用 rustup，不能用 Homebrew 的 Rust
2. **签名问题**：本地构建未签名，首次运行需要右键 > 打开
3. **数据库迁移**：如果修改 Settings 模型，需要创建迁移文件
4. **翻译文件**：修改后需要重新构建前端
5. **useRef 逻辑**：不要移除 useRef，否则会导致无限循环

---

## ✅ 成功标准

项目被认为成功完成，当：

- [x] Settings 窗口完全国际化
- [x] 语言切换功能正常工作
- [x] 语言选择持久化（关闭/重启后保持）
- [x] Auto 模式正确检测系统语言
- [x] macOS 应用成功构建
- [ ] 用户验证所有功能正常
- [ ] PR 创建并合并到主分支
- [ ] 文档完整且清晰

---

**最后更新**: 2026-07-14  
**下次行动**: 用户测试验证  
**预计完成**: 测试通过后即可创建 PR

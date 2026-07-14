# 🧪 i18n 修复验证指南

**应用状态**: ✅ 正在运行（PID: 35630, 35575）  
**修复版本**: v2  
**日期**: 2026-07-14

---

## 📋 修复内容

### 问题 1: 语言设置不持久

- **症状**: 关闭 Settings 后再打开，语言显示还原
- **修复**: useEffect 添加响应式依赖
- **状态**: ✅ 已修复

### 问题 2: 无法选中 Auto

- **症状**: 选择 Auto 后显示不正确
- **修复**: 使用 ?? 运算符代替 ||
- **状态**: ✅ 已修复

---

## 🧪 测试清单

请按照以下步骤验证修复：

### ✅ 测试 1: 简体中文持久化

**步骤**:

```
1. 打开 Yaak 应用
2. 按 Cmd+, 打开 Settings
3. 点击 "Interface" 标签（如果不在该标签）
4. 在 Language 下拉框中选择 "简体中文"
5. 观察界面立即切换为中文
6. 关闭 Settings 窗口（点击 X 或按 Esc）
7. 等待 2 秒
8. 按 Cmd+, 重新打开 Settings
9. 查看 Language 下拉框的值
```

**预期结果**:

- ✅ 第 9 步：下拉框应该显示 "简体中文"
- ✅ 界面应该保持中文显示
- ❌ 如果显示 "Auto" 或 "English"，说明修复失败

---

### ✅ 测试 2: Auto 选项可选

**步骤**:

```
1. 在 Settings > Interface 页面
2. 在 Language 下拉框中选择 "Auto"
3. 观察界面根据系统语言切换（应该是中文或英文）
4. 查看下拉框是否显示 "Auto"
5. 关闭 Settings 窗口
6. 重新打开 Settings
7. 查看 Language 下拉框的值
```

**预期结果**:

- ✅ 第 4 步：下拉框应该显示 "Auto"
- ✅ 第 7 步：下拉框应该仍然显示 "Auto"
- ❌ 如果显示 "简体中文" 或 "English"，说明修复失败

---

### ✅ 测试 3: 英文持久化

**步骤**:

```
1. 在 Settings > Interface 页面
2. 在 Language 下拉框中选择 "English"
3. 观察界面立即切换为英文
4. 关闭 Settings 窗口
5. 重新打开 Settings
6. 查看 Language 下拉框的值
```

**预期结果**:

- ✅ 下拉框应该显示 "English"
- ✅ 界面应该保持英文显示

---

### ✅ 测试 4: 语言切换循环

**步骤**:

```
1. 选择 "简体中文" → 关闭 → 重新打开 Settings
   检查: 显示 "简体中文" ✅/❌

2. 选择 "English" → 关闭 → 重新打开 Settings
   检查: 显示 "English" ✅/❌

3. 选择 "Auto" → 关闭 → 重新打开 Settings
   检查: 显示 "Auto" ✅/❌

4. 选择 "简体中文" → 关闭 → 重新打开 Settings
   检查: 显示 "简体中文" ✅/❌
```

**预期结果**:

- ✅ 每次重新打开都显示上次选择的值
- ✅ 界面语言与选择一致

---

### ✅ 测试 5: 应用重启持久化

**步骤**:

```
1. 在 Settings > Interface 页面
2. 选择 "简体中文"
3. 完全退出应用（Cmd+Q）
4. 重新启动 Yaak
5. 观察应用启动时的语言
6. 打开 Settings > Interface
7. 查看 Language 下拉框的值
```

**预期结果**:

- ✅ 第 5 步：应用应该以中文启动
- ✅ 第 7 步：下拉框应该显示 "简体中文"

---

### ✅ 测试 6: 导航标签国际化

**步骤**:

```
1. 选择 "简体中文"
2. 在 Settings 窗口查看左侧导航标签
3. 选择 "English"
4. 再次查看左侧导航标签
```

**预期结果**:

**简体中文时**:

- ✅ General → 通用
- ✅ Interface → 界面
- ✅ Theme → 主题
- ✅ Shortcuts → 快捷键
- ✅ Plugins → 插件
- ✅ Proxy → 代理
- ✅ Certificates → 证书
- ✅ License → 许可证

**English 时**:

- ✅ 显示英文标签

---

### ✅ 测试 7: 窗口标题国际化

**步骤**:

```
1. 选择 "简体中文"
2. 查看 Settings 窗口的标题（窗口顶部）
3. 选择 "English"
4. 再次查看窗口标题
```

**预期结果**:

- ✅ 简体中文：窗口标题显示 "设置"
- ✅ English：窗口标题显示 "Settings"

---

## 📊 测试结果记录

请填写测试结果：

```
测试 1 - 简体中文持久化:        [ ] 通过  [ ] 失败
测试 2 - Auto 选项可选:          [ ] 通过  [ ] 失败
测试 3 - 英文持久化:             [ ] 通过  [ ] 失败
测试 4 - 语言切换循环:           [ ] 通过  [ ] 失败
测试 5 - 应用重启持久化:         [ ] 通过  [ ] 失败
测试 6 - 导航标签国际化:         [ ] 通过  [ ] 失败
测试 7 - 窗口标题国际化:         [ ] 通过  [ ] 失败
```

---

## 🐛 如果测试失败

### 失败场景 1: 仍然无法选中 Auto

**可能原因**:

- 应用没有使用最新构建
- 缓存问题

**解决方法**:

```bash
# 完全退出应用
pkill -9 -f "Yaak.app"

# 清理并重新构建
cd /Users/oam/Workspace/opensource/yaak-i18n
rm -rf target/aarch64-apple-darwin/release/bundle
npm run client:build
cd crates-tauri/yaak-app-client
cargo tauri build --target aarch64-apple-darwin --bundles app

# 重新启动
open target/aarch64-apple-darwin/release/bundle/macos/Yaak.app
```

### 失败场景 2: 语言仍然不持久

**可能原因**:

- 数据库更新失败
- useEffect 依赖未生效

**调试方法**:

1. 打开开发者工具（如果可用）
2. 查看 console 日志
3. 检查是否有错误信息

---

## 📂 相关文件

**修复的文件**:

- `apps/yaak-client/hooks/useLanguage.ts`
- `apps/yaak-client/components/Settings/SettingsInterface.tsx`

**文档**:

- `I18N_SETTINGS_FIX_V2.md` - 详细修复报告
- `LANGUAGE_ISSUES_FIXED.md` - 初始修复报告
- `MACOS_BUILD_SUCCESS.md` - 构建成功报告

---

## 🎯 成功标准

所有 7 个测试都应该通过。如果有任何失败，请记录：

1. 具体是哪个测试失败
2. 实际看到的行为
3. 预期的行为
4. 任何错误消息

---

## ✅ 验证完成后

如果所有测试通过：

1. 在本文档中标记所有测试为 "通过"
2. 准备创建 Pull Request
3. 或继续其他开发工作

如果有测试失败：

1. 记录详细的失败信息
2. 我们将进一步调试和修复

---

**当前应用位置**:

```
/Users/oam/Workspace/opensource/yaak-i18n/target/aarch64-apple-darwin/release/bundle/macos/Yaak.app
```

**Git 状态**: ✅ 已提交并推送到 feature/i18n 分支

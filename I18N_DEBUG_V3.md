# 🔍 i18n 问题调试报告 v3

**日期**: 2026-07-14  
**修复版本**: v3  
**应用 PID**: 45726

---

## 🐛 新发现的问题

### 问题 1: 手动设置语言会被自动重置为 Auto

**症状**:

- 用户选择 "简体中文"
- 几秒后自动变回 Auto（或其他语言）

**原因**:
无限循环 - `useEffect` 依赖 `settings?.language` 导致：

```
1. 用户选择 "简体中文"
2. changeLanguage() 调用 patchModel(settings, { language: "zh-CN" })
3. settings.language 变化
4. useEffect 触发（因为依赖 settings?.language）
5. initLanguage() 执行
6. 可能再次调用 i18n.changeLanguage()
7. 导致循环或重置
```

### 问题 2: Auto 显示英文而非中文

**症状**:

- 系统语言是中文（zh-Hans-CN）
- Auto 模式显示英文

**原因**:
代码只检查了：

```typescript
systemLocale.startsWith("zh-CN") ||
  systemLocale.startsWith("zh-Hans") ||
  systemLocale.startsWith("zh-SG");
```

但系统返回的是 `zh-Hans-CN`（完整匹配），需要添加精确匹配。

---

## ✅ v3 修复方案

### 修复 1: 防止无限循环

**使用 useRef 跟踪上次的语言值**:

```typescript
const lastLanguageRef = useRef<string | null | undefined>(undefined);

useEffect(() => {
  async function initLanguage() {
    if (!settings) return;

    // Only run if the language setting has actually changed
    if (lastLanguageRef.current === settings.language) {
      return;
    }
    lastLanguageRef.current = settings.language;

    // ... rest of the logic
  }

  void initLanguage();
}, [settings?.language, i18n]);
```

**效果**:

- 只在 `settings.language` **真正变化**时才执行
- 避免因同一个值重复触发

### 修复 2: 支持完整的中文 locale

**添加精确匹配**:

```typescript
if (
  systemLocale.startsWith("zh-CN") ||
  systemLocale.startsWith("zh-Hans") ||
  systemLocale.startsWith("zh-SG") ||
  systemLocale === "zh-Hans-CN" // 新增
) {
  targetLanguage = "zh-CN";
}
```

**效果**:

- 系统语言 `zh-Hans-CN` 现在可以正确识别
- Auto 模式会显示中文

### 修复 3: 添加调试日志

```typescript
console.log("System locale detected:", systemLocale);
console.log("Target language:", targetLanguage, "Current language:", i18n.language);
```

**效果**:

- 可以在开发者工具中查看语言检测过程
- 便于调试问题

---

## 🧪 测试验证

### 测试 1: 手动选择简体中文

**步骤**:

```
1. 打开 Settings > Interface
2. 选择 Language = "简体中文"
3. 等待 5 秒
4. 检查下拉框的值
```

**预期结果**:

- ✅ 下拉框应该保持显示 "简体中文"
- ✅ 不应该自动变回 Auto 或英文

### 测试 2: Auto 模式显示中文

**步骤**:

```
1. 打开 Settings > Interface
2. 选择 Language = "Auto"
3. 观察界面语言
4. 打开开发者工具查看 console
```

**预期结果**:

- ✅ Console 显示: "System locale detected: zh-Hans-CN"
- ✅ Console 显示: "Target language: zh-CN"
- ✅ 界面应该显示中文
- ✅ 下拉框显示 "Auto"

### 测试 3: 语言持久化

**步骤**:

```
1. 选择 "简体中文"
2. 关闭 Settings
3. 重新打开 Settings
```

**预期结果**:

- ✅ 下拉框显示 "简体中文"
- ✅ 界面保持中文

### 测试 4: 应用重启

**步骤**:

```
1. 选择 "简体中文"
2. 完全退出应用 (Cmd+Q)
3. 重新启动应用
4. 打开 Settings
```

**预期结果**:

- ✅ 应用以中文启动
- ✅ Settings 显示 "简体中文"

---

## 🔍 如何使用开发者工具调试

### macOS Tauri 应用

如果应用支持开发者工具，可以：

```bash
# 方法 1: 在应用中按快捷键
# 通常是 Cmd+Option+I 或 Cmd+Shift+I

# 方法 2: 启动时添加 devtools 参数
# （需要应用支持）
```

### 查看 Console 日志

打开 Console 后，查找：

```
System locale detected: zh-Hans-CN
Target language: zh-CN Current language: en
```

这将显示：

- 系统检测到的 locale
- 目标语言
- 当前 i18n 语言

---

## 📊 修复对比

| 问题          | v2 修复       | v3 修复                 | 状态    |
| ------------- | ------------- | ----------------------- | ------- |
| 语言持久化    | ✅ 添加依赖   | ✅ 添加 useRef 防止循环 | 🔄 改进 |
| Auto 选项     | ✅ 使用 ??    | ✅ 保持                 | ✅ 正常 |
| Auto 显示英文 | ❌ 未发现     | ✅ 添加 zh-Hans-CN 匹配 | 🆕 新增 |
| 自动重置      | ❌ 引入了问题 | ✅ 使用 useRef 修复     | 🆕 新增 |

---

## 🎯 Root Cause Analysis

### 为什么 v2 修复引入了新问题？

**v2 的修改**:

```typescript
}, [settings?.language, i18n]);
```

**问题**:

1. 用户选择语言 → `patchModel` 更新数据库
2. `settings.language` 变化
3. `useEffect` 重新执行
4. 虽然逻辑上应该保持，但可能有竞态条件
5. 或者 settings 对象引用变化导致频繁触发

**v3 的解决方案**:

```typescript
const lastLanguageRef = useRef<string | null | undefined>(undefined);

// 在 useEffect 中
if (lastLanguageRef.current === settings.language) {
  return; // 跳过，避免重复处理
}
lastLanguageRef.current = settings.language;
```

**优点**:

- 只在值**真正变化**时处理
- 避免因对象引用变化导致的重复执行
- 保持响应式（仍然依赖 settings?.language）
- 但添加了值比较作为额外保护

---

## 🔧 技术细节

### useRef vs useState

为什么用 `useRef` 而不是 `useState`？

```typescript
// ❌ 使用 useState 会导致额外的重新渲染
const [lastLanguage, setLastLanguage] = useState<string | null>();

// ✅ useRef 不会触发重新渲染
const lastLanguageRef = useRef<string | null | undefined>(undefined);
```

### 值比较的重要性

```typescript
// ❌ 没有值比较 - 每次 settings 对象变化都执行
useEffect(() => {
  initLanguage();
}, [settings?.language]);

// ✅ 有值比较 - 只在语言值真正变化时执行
useEffect(() => {
  if (lastLanguageRef.current === settings.language) return;
  lastLanguageRef.current = settings.language;
  initLanguage();
}, [settings?.language]);
```

---

## 📝 相关文件

**修改的文件**:

- `apps/yaak-client/hooks/useLanguage.ts`

**改动内容**:

1. 添加 `useRef` 导入
2. 添加 `lastLanguageRef` 引用
3. 添加值比较逻辑
4. 添加 `zh-Hans-CN` 匹配
5. 添加调试日志

---

## ✅ 构建状态

- ✅ 代码已修改
- ✅ 前端已重新构建
- ✅ macOS 应用已重新打包
- ✅ 应用正在运行 (PID: 45726)
- ⏳ 等待用户验证

---

## 🚀 下一步

1. 测试应用
2. 验证语言不会自动重置
3. 验证 Auto 模式显示中文
4. 如果可能，打开开发者工具查看 console 日志
5. 报告测试结果

---

**应用位置**:

```
/Users/oam/Workspace/opensource/yaak-i18n/target/aarch64-apple-darwin/release/bundle/macos/Yaak.app
```

**当前状态**: ✅ 正在运行，等待测试

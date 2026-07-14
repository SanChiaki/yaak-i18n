# i18n 语言设置修复报告

**日期**: 2026-07-14  
**修复版本**: v2

---

## 🐛 报告的问题

### 问题 1: 关闭 Settings 后语言还原

**描述**: 在 Settings 中修改完语言后，关闭 Settings 窗口，再次打开时，语言显示还原回英文。

**原因分析**:

```typescript
// 之前的代码
useEffect(() => {
  async function initLanguage() {
    // ... 语言初始化逻辑
  }
  void initLanguage();
}, []); // ❌ 空依赖数组，只在组件挂载时运行一次
```

问题在于 `useEffect` 的依赖数组为空，导致：

1. 当 `settings.language` 在数据库中更新后
2. `useLanguage` hook 不会重新执行
3. 下次打开 Settings 时，仍然使用旧的语言状态

### 问题 2: 无法选中 Auto

**描述**: 在语言下拉菜单中无法选中 "Auto" 选项。

**原因分析**:

```typescript
// 之前的代码
const displayLanguage = settings.language || currentLanguage || "auto";
```

问题在于 `displayLanguage` 的计算逻辑：

1. 当用户选择 "Auto" 时，`settings.language` 被设置为 `null`
2. 由于 `||` 运算符，`null` 被认为是 falsy
3. 于是 `displayLanguage` 退回到 `currentLanguage`（如 "zh-CN"）
4. 下拉框显示 "简体中文" 而不是 "Auto"

---

## ✅ 修复方案

### 修复 1: 响应 settings 变化

**文件**: `apps/yaak-client/hooks/useLanguage.ts`

**修改前**:

```typescript
  }, []);
```

**修改后**:

```typescript
  }, [settings?.language, i18n]);
```

**效果**:

- 当 `settings.language` 在数据库中更新后
- `useEffect` 会重新执行
- 自动应用新的语言设置
- 重新打开 Settings 时显示正确的语言

### 修复 2: 正确处理 null 值

**文件**: `apps/yaak-client/components/Settings/SettingsInterface.tsx`

**修改前**:

```typescript
// Use current i18n language as the source of truth for the dropdown
const displayLanguage = settings.language || currentLanguage || "auto";
```

**修改后**:

```typescript
// Display the language from settings, or "auto" if null
const displayLanguage = settings.language ?? "auto";
```

**效果**:

- 使用空值合并运算符 `??` 而不是 `||`
- 当 `settings.language` 为 `null` 时，正确显示 "auto"
- 当 `settings.language` 为 "zh-CN" 时，显示 "简体中文"
- 当 `settings.language` 为 "en" 时，显示 "English"

---

## 🧪 测试验证

### 测试场景 1: 选择简体中文

**步骤**:

1. 打开 Settings > Interface
2. Language 选择 "简体中文"
3. 界面立即切换为中文
4. 关闭 Settings 窗口
5. 重新打开 Settings

**预期结果**:

- ✅ Language 下拉框显示 "简体中文"
- ✅ 界面保持中文显示

### 测试场景 2: 选择 Auto

**步骤**:

1. 打开 Settings > Interface
2. Language 选择 "Auto"
3. 界面根据系统语言切换
4. 关闭 Settings 窗口
5. 重新打开 Settings

**预期结果**:

- ✅ Language 下拉框显示 "Auto"
- ✅ 界面根据系统语言显示

### 测试场景 3: 切换不同语言

**步骤**:

1. 选择 "简体中文" → 关闭 → 重新打开
2. 选择 "English" → 关闭 → 重新打开
3. 选择 "Auto" → 关闭 → 重新打开

**预期结果**:

- ✅ 每次重新打开都显示上次选择的语言
- ✅ 下拉框值正确

### 测试场景 4: 应用重启

**步骤**:

1. 选择 "简体中文"
2. 完全退出应用 (Cmd+Q)
3. 重新启动应用
4. 打开 Settings

**预期结果**:

- ✅ 应用启动时就是中文界面
- ✅ Settings 显示 "简体中文"

---

## 🔧 技术细节

### 语言设置流程

```
用户选择语言
    ↓
onChange 处理器
    ↓
patchModel(settings, { language })  ← 更新数据库
    ↓
settings.language 变化
    ↓
useEffect [settings?.language] 触发  ← 关键修复点
    ↓
initLanguage() 执行
    ↓
i18n.changeLanguage(targetLanguage)
    ↓
界面更新
```

### 显示值计算

```typescript
// 修复前
settings.language || currentLanguage || "auto";
// 问题: null 被视为 falsy，回退到 currentLanguage

// 修复后
settings.language ?? "auto";
// 正确: 只有 null/undefined 时才使用 "auto"
```

### `||` vs `??` 的区别

```typescript
// || (逻辑或)
null || "fallback"; // → "fallback"
false || "fallback"; // → "fallback"
0 || "fallback"; // → "fallback"
"" || "fallback"; // → "fallback"

// ?? (空值合并)
null ?? "fallback"; // → "fallback"
undefined ?? "fallback"; // → "fallback"
false ?? "fallback"; // → false
0 ?? "fallback"; // → 0
"" ?? "fallback"; // → ""
```

---

## 📊 修改对比

| 方面               | 修复前      | 修复后      |
| ------------------ | ----------- | ----------- |
| **关闭后重新打开** | ❌ 显示错误 | ✅ 显示正确 |
| **选择 Auto**      | ❌ 无法选中 | ✅ 可以选中 |
| **应用重启**       | ✅ 正常     | ✅ 正常     |
| **语言切换**       | ✅ 正常     | ✅ 正常     |

---

## 🎯 Root Cause Analysis

### 为什么会有这个问题？

1. **设计假设不匹配**
   - 代码假设 `settings.language` 只会在初始化时设置
   - 实际上用户可以在运行时更改

2. **错误的 falsy 处理**
   - `null` 是 `auto` 的合法值
   - 使用 `||` 导致 `null` 被错误处理

3. **缺少响应式更新**
   - `useEffect` 依赖不完整
   - 无法响应 settings 变化

### 如何避免类似问题？

1. **正确使用依赖数组**

   ```typescript
   // ❌ 错误
   useEffect(() => { ... }, []);

   // ✅ 正确 - 包含所有使用的外部变量
   useEffect(() => { ... }, [settings?.language, i18n]);
   ```

2. **区分 falsy 和 nullish**

   ```typescript
   // ❌ 当需要区分 null 时不要用 ||
   const value = settings.value || "default";

   // ✅ 使用 ?? 处理 null/undefined
   const value = settings.value ?? "default";
   ```

3. **明确 null 的语义**
   - `null` 应该有明确的含义（如 "auto"）
   - 在代码中一致地处理 `null` 值

---

## 📝 相关文件

- `apps/yaak-client/hooks/useLanguage.ts`
- `apps/yaak-client/components/Settings/SettingsInterface.tsx`

---

## ✅ 修复状态

- ✅ 代码已修改
- ✅ 前端已重新构建
- ✅ macOS 应用已重新打包
- ⏳ 等待用户验证

---

## 🚀 下一步

1. 测试修复后的应用
2. 验证所有测试场景
3. 确认问题已解决
4. 提交代码并推送到 GitHub

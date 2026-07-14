# Yaak i18n 项目 - 快速启动指南

## 🚀 快速开始

### 1. 验证实现

```bash
# 运行自动化测试
node scripts/test-i18n.js
```

### 2. 查看功能

在应用中：

1. 打开 **设置 (Settings)**
2. 点击 **界面 (Interface)** 选项卡
3. 找到 **语言 (Language)** 设置
4. 选择语言：
   - Auto (System Language) - 自动检测
   - English - 英文
   - 简体中文 - 中文

### 3. 添加新翻译

#### 步骤 1: 添加英文翻译

编辑 `apps/yaak-client/locales/en/[namespace].json`:

```json
{
  "myNewKey": "My New Text"
}
```

#### 步骤 2: 添加中文翻译

编辑 `apps/yaak-client/locales/zh-CN/[namespace].json`:

```json
{
  "myNewKey": "我的新文本"
}
```

#### 步骤 3: 在组件中使用

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();
  return <div>{t("namespace:myNewKey")}</div>;
}
```

## 📖 完整文档

- [I18N.md](./I18N.md) - 完整使用文档
- [I18N_FINAL_DELIVERY.md](./I18N_FINAL_DELIVERY.md) - 交付报告
- [I18N_TEST_REPORT.md](./I18N_TEST_REPORT.md) - 测试报告

## 🎯 项目状态

✅ **实现完成**: 6 个提交  
✅ **测试通过**: 18/18 自动化测试  
✅ **翻译完成**: 151 个键，100% 匹配  
✅ **文档齐全**: 5 个详细文档

## 📊 统计

- **新增文件**: 24 个
- **修改文件**: 6 个
- **代码行数**: 2,357+
- **翻译文件大小**: ~10 KB

## 🔧 技术栈

- i18next v26.3.6
- react-i18next v17.0.9
- TypeScript 类型安全

---

**分支**: `feature/i18n`  
**基于**: v2026.4.0  
**状态**: ✅ 可以进入人工测试

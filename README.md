# jsonHandle

一个用于处理和格式化 JSON 数据的 Safari 浏览器扩展。

<div align="center">

  
  <!-- 添加项目状态徽章 -->
  ![License](https://img.shields.io/badge/license-MIT-blue.svg)
  ![Platform](https://img.shields.io/badge/platform-Safari-orange.svg)
  ![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
</div>

## ✨ 功能特点

- 🔍 自动检测网页中的 JSON 数据并格式化显示
- 🌲 支持 JSON 数据的折叠/展开
- 🎨 提供语法高亮，便于阅读
- 📋 支持 JSON 数据的复制和下载
- 🎯 可自定义主题和格式化选项
- 🧭 显示当前选中节点路径与类型信息
- 🗂 支持树视图/原始视图切换



## 🚀 安装方法

### 从 App Store 安装

1. 访问 [Mac App Store](https://apps.apple.com/) 搜索 "jsonHandle"
2. 点击"获取"并完成安装
3. 在 Safari 浏览器中启用该扩展：
   - Safari > 设置 > 扩展 > 勾选 jsonHandle

### 手动安装

1. 克隆此仓库：
```bash
git clone https://github.com/jojo-jie/jsonHandle.git
```
2. 使用 Xcode 打开项目
3. 构建并运行项目
4. 在 Safari 浏览器中启用该扩展

## 📖 使用方法

1. 安装并启用扩展后，访问任何包含 JSON 数据的页面
2. 扩展会自动检测并格式化 JSON 数据
3. 使用工具栏上的按钮进行以下操作：
   - 折叠/展开 JSON 节点
   - 展开全部 / 折叠全部
   - 复制 JSON 数据
   - 复制选中节点路径与值
   - 下载 JSON 文件
   - 切换原始视图 / 树视图
   - 切换主题样式

## ⌨️ 快捷键

- `⌘/Ctrl + K`：打开搜索
- `⌘/Ctrl + C`：复制当前选中节点的值
- `Esc`：关闭搜索

## ⚙️ 设置项（弹窗）

- 主题：`Auto / Light / Dark`
- 折叠阈值：数组/对象元素超过该值自动折叠
- 最大 JSON 大小：超出后不进行渲染
- 统计信息：显示 JSON 大小与元素数量

## 🛠️ 开发

### 环境要求

- macOS 11.0 或更高版本
- Xcode 13.0 或更高版本
- Safari 14.0 或更高版本

### 构建步骤

1. 克隆仓库并进入项目目录：
```bash
git clone https://github.com/jojo-jie/jsonHandle.git
cd jsonHandle
```
2. 使用 Xcode 打开项目
3. 选择目标设备并点击运行

### 扩展代码结构（重构后）

- `jsonHandle Extension/Resources/shared/settings.js`：弹窗与内容脚本共享的设置默认值与归一化逻辑
- `jsonHandle Extension/Resources/content.js`：JSON 检测、渲染、搜索、交互与复制/下载
- `jsonHandle Extension/Resources/background.js`：网络响应监听、JSON 请求候选判定与消息分发
- `jsonHandle Extension/Resources/popup.js`：弹窗状态展示与设置写入

## 🤝 贡献指南

1. Fork 本仓库
2. 创建您的特性分支：`git checkout -b feature/AmazingFeature`
3. 提交您的更改：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 打开一个 Pull Request

## 📝 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解详细的更新历史。

## 📄 许可证

本项目采用 MIT 许可证 - 详情请查看 [LICENSE](LICENSE) 文件。

## 💬 联系方式

如有问题或建议，请通过以下方式联系：

- [创建 Issue](https://github.com/jojo-jie/jsonHandle/issues)

## ⭐ 支持项目

如果这个项目对您有帮助，请给它一个星标 ⭐️

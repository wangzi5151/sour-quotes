# 🍋 每日毒鸡汤 - Daily Sour Quotes

> 每天一句扎心语录，笑着活下去。
> 反鸡汤、丧中带梗，专治各种想不开、睡不着、过度自信。

![version](https://img.shields.io/badge/version-1.1.0-ff6b81)
![license](https://img.shields.io/badge/license-MIT-green)
![platform](https://img.shields.io/badge/platform-Android%20%7C%20PWA-60a5fa)

## ✨ 为什么是它

毒鸡汤是网络流行文化的经典品类——**扎心但好笑，自带传播基因**。
每条语录都短小精悍、适合截图分享，天然适配朋友圈 / 微博 / 群聊 / 短视频评论区。

这个 App 把「毒鸡汤」做成了每日仪式感：每天固定一句（可打卡）、随机抽取、一键复制分享，
还能一键生成**精美分享卡片图**发朋友圈，**完全离线可用、无广告、无追踪**。

## 🚀 功能特性

| 功能 | 说明 |
| --- | --- |
| 📅 今日毒鸡汤 | 每天固定同一句，支持每日打卡仪式感 |
| 🎲 再来一碗 | 从当前分类随机抽取，喝到吐为止 |
| 🖼️ 分享卡片图 | 一键生成 1080×1440 精美卡片，保存/分享朋友圈 |
| 🔥 每日打卡 | 连续打卡记录 + 7 天日历视图 |
| 🔔 每日提醒 | 本地通知定时提醒（原生支持） |
| 🔊 语音朗读 | TTS 朗读语录（Web / 原生均支持） |
| 🗂️ 六大分类 | 生活 / 爱情 / 工作 / 梦想 / 社交 / 金钱 |
| 💖 收藏夹 | 扎心的句子一键收藏，随时回顾 |
| 📤 导出收藏 | 一键复制全部收藏 |
| 📋 一键复制 | 复制到剪贴板，发朋友圈 / 群聊 |
| 🚀 原生分享 | 调起系统分享面板（Capacitor Share） |
| ⏮️ 上一条 | 回溯刚才的句子，支持左右滑动切换 |
| 🎨 多主题 | 5 套配色（暗黑 / 午夜 / 日落 / 森林 / 明亮） |
| 🌀 原生触感 | 轻触 / 成功 / 失败振动反馈（Capacitor Haptics） |
| 📴 离线可用 | 全部语录内置，无网络也能用 |

## 📚 语录库

内置 **140+ 条原创毒鸡汤**，带情绪标签（扎心 / 真相 / 哲理 / 单身 / 金钱 / 安慰），
每条按「⚡ 文本 + 🏷️ 标签」结构存储，方便社区扩展。

## 🛠️ 技术栈

- **前端**: 原生 HTML / CSS / JavaScript（零框架，Vite 构建）
- **Android 封装**: Capacitor 6
- **原生插件**: Clipboard / Share / Haptics / LocalNotifications / SplashScreen / StatusBar
- **存储**: LocalStorage（收藏夹 / 打卡 / 主题 / 设置）
- **图片生成**: Canvas（分享卡片图）
- **离线**: 全部资源内置，SPA 单页应用

## 📦 安装与使用

### 直接安装（推荐）

从 [Releases](https://github.com/yourname/sour-quotes/releases) 下载最新 APK 安装即可。

也可以直接用浏览器打开 PWA 版本（支持添加到主屏幕）。

### 从源码构建

```bash
# 1. 安装依赖
npm install

# 2. 构建 Web 版
npm run build

# 3. 同步到 Android 平台
npx cap sync android

# 4. 构建 APK（Termux / Linux 需配置 aapt2，见下文）
cd android && ./gradlew assembleDebug

# 产物位于 android/app/build/outputs/apk/debug/app-debug.apk
```

### Termux 构建注意事项

在 Termux（aarch64）上构建 Android 项目时，Google 官方分发的 `aapt2` 是 x86_64
二进制，无法直接运行。本项目通过 `android/gradle.properties` 中的
`android.aapt2FromMavenOverride` 指向 Termux 自带的 aarch64 原生 `aapt2` 解决：

```properties
android.aapt2FromMavenOverride=/data/data/com.termux/files/usr/bin/aapt2
```

## 📂 项目结构

```
sour-quotes/
├── android/                 # Capacitor Android 工程
│   ├── app/                 # Android 应用模块
│   └── gradle.properties    # 含 Termux aapt2 override
├── public/
│   ├── icons/               # 应用图标（SVG / PNG）
│   └── manifest.webmanifest # PWA 清单
├── src/
│   ├── css/style.css        # 暗色主题样式（5 套主题变量）
│   ├── data/quotes.js       # 毒鸡汤语录库（140+ 条，可扩展）
│   └── js/
│       ├── main.js          # 应用逻辑（打卡/收藏/主题/朗读）
│       ├── native.js        # Capacitor 原生能力封装（含 Web 降级）
│       └── card.js          # 分享卡片图生成（Canvas）
├── index.html
├── vite.config.js
├── capacitor.config.json
├── package.json
├── LICENSE                 # MIT 许可证
├── docs/                   # CHANGELOG / 贡献指南
└── SourQuotes.v1.1.0.apk   # 发行版 APK
```

## 🤝 贡献

欢迎贡献语录、翻译、UI 优化：

1. 添加语录：编辑 `src/data/quotes.js`，按现有格式追加即可
2. 提交 PR 或直接在 Issues 里投喂你的毒鸡汤 💀

## 📄 许可证

[MIT License](LICENSE)

---

🍋 **温馨提示**：本 App 纯属娱乐，若你因此哭出声来，请记得——笑一笑，日子还得过。

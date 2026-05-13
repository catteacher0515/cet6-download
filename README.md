# CET6 Download

一个面向英语六级用户的纯工具站。

核心目标很直接：不登录、不跳转、不做无关拦截，直接提供六级真题 PDF、在线预览和已接入的听力资源。

线上地址：

- `https://catteacher0515.github.io/cet6-download/`

## 项目特点

- 首页只保留最核心的引导：进入真题下载页
- 真题按 `年份 / 月份 / 第几套` 的结构展示，符合用户直觉
- 支持在线预览真题
- 支持单篇 PDF 直接下载
- 支持批量下载全部真题
- 支持按勾选结果自定义打包下载
- 已接入的真题可在预览页底部直接播放听力
- 站点为静态部署，适合长期低维护运行

## 当前内容范围

- 当前已收录 `2021 - 2025` 的六级真题，共 `30` 套
- 当前提供：
  - 在线预览
  - PDF 下载
  - 部分真题的听力播放
- 答案与解析暂未纳入当前版本

## 技术栈

- `Astro`
- `TypeScript`
- `pdf.js`
- `JSZip`
- `GitHub Pages`

## 本地开发

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

常用命令：

```bash
npm run test
npm run build
npm run check
npm run validate:content
```

说明：

- `npm run test`：运行数据与页面相关测试
- `npm run build`：构建静态站点
- `npm run check`：执行 Astro 检查和测试
- `npm run validate:content`：检查 `src/data/cet6.ts` 里声明的 PDF、预览图、音频文件是否真实存在

## 项目结构

```text
src/
  data/
    cet6.ts                  真题数据源与辅助方法
  layouts/
    BaseLayout.astro         全站布局
  pages/
    index.astro              首页
    papers.astro             真题列表页
    papers/[year]/[month]/[setNumber].astro
                              真题预览页
  scripts/
    papers-batch-download.ts 批量下载前端逻辑
    pdf-reader.ts            预览页 PDF / 听力交互
  styles/
    global.css               全局样式

scripts/
  prepare-paper.ts           准备单套真题资源
  prepare-session.ts         一次导入某年某月的 3 套真题
  prepare-paper-lib.ts       资源导入公共逻辑
  validate-content.ts        校验静态资源完整性
  generate-batch-archive.ts  生成默认整包下载 zip
  generate-mobile-preview-pages.ts
                              生成移动端分页预览图

public/
  papers/                    PDF 文件
  previews/                  预览图与移动端分页图片
  audio/                     听力音频
  downloads/                 默认批量下载 zip
```

## 真题数据维护

真题数据统一维护在：

- `src/data/cet6.ts`

每条数据至少包含：

- 年份
- 月份
- 套数
- PDF 路径
- 预览图路径

如果该套真题已接入听力，则额外包含：

- `audioPath`

站点展示顺序采用：

- 年份倒序
- 月份倒序
- 套数正序

也就是越新的真题越靠前，同一场次内按 `第1套 -> 第2套 -> 第3套` 展示。

## 新增一套真题

如果只是补一套，可以使用：

```bash
npm run prepare:paper -- <year> <month> <setNumber> <sourcePdfPath>
```

示例：

```bash
npm run prepare:paper -- 2026 6 1 "/absolute/path/to/file.pdf"
```

这条命令会完成：

- 复制 PDF 到 `public/papers/...`
- 生成首张预览图到 `public/previews/...`

注意：

- `month` 只能是 `6` 或 `12`
- `setNumber` 只能是 `1`、`2`、`3`
- 该命令只准备资源，不会自动写入 `src/data/cet6.ts`

## 新增某年某月的一整场真题

如果要一次性补齐某半年 3 套真题，使用：

```bash
npm run prepare:session -- <year> <month> <set1PdfPath> <set2PdfPath> <set3PdfPath>
```

示例：

```bash
npm run prepare:session -- 2026 12 "/path/set1.pdf" "/path/set2.pdf" "/path/set3.pdf"
```

如果希望导入后自动跑校验，带上 `--verify`：

```bash
npm run prepare:session -- 2026 12 "/path/set1.pdf" "/path/set2.pdf" "/path/set3.pdf" --verify
```

`--verify` 会自动执行：

```bash
npm run validate:content
npm run test
npm run build
```

## 听力资源维护

听力文件放在：

- `public/audio/<year>/<month>/`

命名规则与真题主数据保持一致，例如：

- `public/audio/2025/12/cet6-2025-12-set-01.mp3`

如果某套真题没有听力，不需要强行补字段；页面会自动按“无听力”处理。

## 批量下载说明

真题页里的批量下载分两种路径：

1. 默认全选全部真题
2. 用户手动勾选部分真题

默认全选时，直接下载预先生成好的静态 zip：

- `public/downloads/cet6-papers.zip`

这条路径的优势是：

- 不需要浏览器临时打包
- 移动端体验更稳定
- 用户点击后更快进入真实下载进度

如果用户取消全选、只下载部分真题，则前端使用 `JSZip` 进行自定义打包。

当真题内容新增后，如需刷新默认整包 zip，执行：

```bash
node scripts/generate-batch-archive.ts
```

## 移动端预览说明

桌面端预览主要使用 `pdf.js` 渲染。

移动端为了减少 PDF 直接渲染的失败率与加载压力，补充了一套分页预览图机制。新增或替换 PDF 后，如需重新生成移动端分页图，执行：

```bash
node scripts/generate-mobile-preview-pages.ts
```

该脚本还会同步写出：

- `public/previews/mobile-preview-manifest.json`

## 部署

当前使用 `GitHub Pages` 静态部署。

部署配置文件：

- `.github/workflows/deploy-pages.yml`

触发方式：

- 推送到 `main` 分支后自动执行

部署流程：

1. `npm ci`
2. `npm run test`
3. `npm run build`
4. 上传 `dist/`
5. 发布到 GitHub Pages

站点的 `site` 和 `base` 配置在：

- `astro.config.mjs`

当前配置：

- `site`: `https://catteacher0515.github.io`
- `base`: `/cet6-download`

## 维护建议

- 每年 `6` 月和 `12` 月考试结束后，补充对应 3 套真题
- 新增 PDF 后，优先执行 `npm run validate:content && npm run test && npm run build`
- 如果更新了整站真题集合，记得重新生成默认批量下载 zip
- 如果替换了 PDF，为了保证移动端体验，记得重新生成分页预览图

## License

当前仓库未单独声明开源许可证。

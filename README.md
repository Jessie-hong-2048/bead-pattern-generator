# 拼豆配色图生成器

一个可直接部署到 Vercel 的 Next.js 工具：上传图片后自动生成拼豆配色网格图，并支持下载包含颜色编号和用量统计的 PNG。

## 功能

- 上传 JPG / PNG / WebP 图片
- 支持原图比例、1:1、4:5、3:4、16:9、9:16
- 支持预设长边尺寸和自定义宽高
- 自动匹配最接近的内置拼豆色卡
- 生成网格图、颜色编号与用量统计
- 支持 PC 和 H5 自适应
- 一键下载 PNG 制作图

## 本地开发

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`

## 构建

```bash
npm run build
```

静态导出产物位于 `out/` 目录，可直接部署到 Vercel。

## Vercel 部署

1. 将项目推送到 GitHub。
2. 在 Vercel 中导入仓库。
3. Framework Preset 选择 `Next.js`。
4. 保持默认构建命令 `next build`。
5. 直接部署即可。

## 当前版本说明

- 使用内置基础拼豆色卡
- 图片裁剪方式为自动居中裁剪
- 当前不支持手动改单颗颜色
- 当前不支持 PDF 导出和历史记录

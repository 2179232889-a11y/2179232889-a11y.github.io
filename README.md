# 罗鑫个人简历网站

米白纸张拼贴风格的个人简历与作品集首页，内容来自用户提供的简历、4 段视频、15 幅系列海报和
7 张获奖证书。

## 线上地址

https://2179232889-a11y.github.io/

## 本地预览

```powershell
npm install
npm run dev
```

打开 `http://127.0.0.1:4175/`。

## 内容位置

- 首页结构：`index.html`
- 版式与响应式样式：`styles.css`
- 影像片段切换、海报与奖状滚动、海报筛选、预览、菜单和动效：`script.js`
- 头像：`public/assets/portrait/`
- 海报：`public/assets/posters/`
- 奖状：`public/assets/awards/`
- 网页视频与封面：`public/assets/video/`
- PDF 简历：`public/assets/docs/`

## 更新素材

替换 `public/assets/` 中的同名文件即可。视频已经转成网页使用的 H.264 MP4，海报已经转成 WebP。
原始 4K 视频和 JPG 海报没有直接放进站点。

## 检查

```powershell
npm run build
```

页面经过桌面端 1440px、平板 768px 和手机 390px 的版式检查；视频弹窗、海报预览、移动端菜单和
PDF 下载均已验证。

AI 影像区可在三段视频之间直接切换；海报区和奖状区都会持续缓慢向左滚动并首尾循环，并明确标注为
部分作品展示。证书与海报均可点击放大，播放按钮、弹窗和移动端菜单均带可访问状态。

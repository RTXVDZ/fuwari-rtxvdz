# Tasks

- [x] Task 1: 在 z-30 内容容器内添加 .blur-source 元素
  - [x] 1.1 编辑 src/layouts/MainGridLayout.astro，在 `<div class="absolute w-full z-30 pointer-events-none">` 内部最前面添加 `<div class="blur-source" aria-hidden="true"></div>`
  - [x] 1.2 确认 #top-row 内的 .blur-source 仍存在（已在之前添加）

- [x] Task 2: 更新 .blur-source CSS 为通用全屏样式
  - [x] 2.1 编辑 src/styles/main.css，将 .blur-source 从 `#top-row .blur-source` 专用选择器改为通用 `.blur-source`
  - [x] 2.2 将 position 从 absolute 改为 fixed，inset:0 全屏覆盖（不再限制 height:4.5rem）
  - [x] 2.3 更新 html.blur-active、html.low-perf、@-moz-document 选择器为通用 .blur-source

- [x] Task 3: 浏览器验证 Chrome 中所有模糊元素生效
  - [x] 3.1 用 browser-use 在 Chrome 中开启高斯模糊，验证导航栏有散景光斑
  - [x] 3.2 验证侧边栏卡片有散景光斑
  - [x] 3.3 验证文章内容卡片有散景光斑
  - [x] 3.4 滑块设为 0/60/100，对比散景锐利度梯度
  - [x] 3.5 检查 .blur-source 元素数量为 2，分别在 #top-row 和 z-30 容器内

- [x] Task 4: 自定义背景 + 高斯模糊组合效果
  - [x] 4.1 编辑 src/utils/setting-utils.ts：在 applyCustomBg 中把图片 URL 同步到 CSS 变量 --custom-bg-url
  - [x] 4.2 编辑 src/styles/main.css：当 html.custom-bg-active 时，.blur-source 背景改为 var(--custom-bg-url)
  - [x] 4.3 用 browser-use 验证：开启自定义背景图片 + 高斯模糊后，卡片背景显示图片的模糊版（毛玻璃效果）
  - [x] 4.4 验证 blur=0/60/100 时模糊梯度明显

# Task Dependencies
- Task 1、Task 2 可并行（不同文件）
- Task 3 依赖 Task 1、Task 2 完成
- Task 4 与 Task 1/2 可并行（不同文件），验证依赖前面完成

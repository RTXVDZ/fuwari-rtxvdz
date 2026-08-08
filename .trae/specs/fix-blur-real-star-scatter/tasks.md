# Tasks

- [x] Task 1: 改造 blur-bokeh-layer 为密集高亮星点群
  - [x] 1.1 编辑 src/layouts/Layout.astro 全局样式中的 `.blur-bokeh-layer`：移除 5 个大块彩色星云径向渐变光斑
  - [x] 1.2 替换为 12+ 个 1.5–2.5px 高亮小星点（alpha 0.85–1.0），300px 平铺重复，颜色以白/浅蓝为主（不再有大块彩色渐变）
  - [x] 1.3 保留 `html.blur-active .blur-bokeh-layer { opacity: var(--meteor-brightness, 1) }` 与默认 opacity:0、low-perf display:none
- [x] Task 2: 增强真实背景星点 body::before
  - [x] 2.1 编辑 src/layouts/Layout.astro 内联 `<style>` 中的 `body::before`：星点数量从 5 个增至 12+ 个
  - [x] 2.2 尺寸从 1px 提升到 1.5–2px，alpha 提升（0.6–0.9），保持 240px 平铺
  - [x] 2.3 微调 opacity 表达式，确保默认夜空更精致但不刺眼
- [x] Task 3: 透明度固定，让滑块唯一控制模糊半径
  - [x] 3.1 编辑 src/styles/main.css：将 `html.blur-active #navbar > div, .card-base` 的 background-color 从 `color-mix(... max(50%, 100% - var(--blur-value)*0.5%), transparent)` 改为固定 `color-mix(in srgb, var(--card-bg) 55%, transparent)`
  - [x] 3.2 同样修改 `.float-panel` 与 `.enable-banner #navbar > div` 的透明度为固定 55%
  - [x] 3.3 保留 backdrop-filter 的 `blur(calc(var(--blur-value) * 1.2px))` 不变
- [x] Task 4: 浏览器验证散景效果与滑块梯度
  - [x] 4.1 访问 localhost:4321，开启模糊，截图导航栏，确认可见星点散景（非彩色渐变）
  - [x] 4.2 将滑块分别设为 0/50/100，截图对比散景锐利度梯度
  - [x] 4.3 关闭模糊，截图确认背景恢复纯净夜空、无彩色残留
  - [x] 4.4 检查控制台无报错

# Task Dependencies
- Task 2、Task 3 可与 Task 1 并行（不同文件/不同选择器）
- Task 4 依赖 Task 1、2、3 全部完成

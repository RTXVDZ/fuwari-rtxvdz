# Chrome backdrop-filter 层叠上下文修复 Spec

## Why
高斯模糊功能在 Firefox 中正常，但在 Chrome/Edge（Chromium 内核）中完全不生效——开启后仅有透明度变化，无散景模糊效果。

**根因**：`#top-row`（z-50 + position:relative）和主内容容器（z-30 + position:absolute）各自创建了独立的层叠上下文（backdrop root）。Chrome 的 `backdrop-filter` 只能模糊同一层叠上下文内已绘制的内容，无法穿透到 body 层的 `.blur-bokeh-layer`（星点层）。Firefox 的 backdrop-filter 实现能穿透层叠上下文，所以不受影响。

之前的 `fix-blur-real-star-scatter` spec 只解决了"星点密度/透明度"问题，未解决此 Chrome 层叠上下文穿透问题。

## What Changes
- 在每个创建层叠上下文的容器内（`#top-row` 和 z-30 内容容器）添加本地 `.blur-source` 星点层，为 Chrome 的 backdrop-filter 提供同上下文内的模糊源
- `.blur-source` 使用 `position: fixed; inset: 0;` 全屏覆盖，z-index:-1 置于容器内最底层
- Firefox 用 `@-moz-document url-prefix()` 隐藏 `.blur-source`（其 backdrop-filter 能穿透，避免双重星点）
- 低性能模式（low-perf）下 `.blur-source` display:none

## Impact
- Affected code:
  - `src/layouts/MainGridLayout.astro`（在 #top-row 和 z-30 容器内添加 .blur-source div）
  - `src/styles/main.css`（.blur-source 样式定义、Firefox 隐藏、low-perf 降级）
- 不影响：Firefox 行为、流星雨动画、自定义背景、设置面板交互、localStorage 持久化

## ADDED Requirements

### Requirement: Chrome/Edge 中 backdrop-filter 生效
系统 SHALL 确保在 Chromium 内核浏览器中，开启高斯模糊后导航栏、侧边栏卡片、文章卡片的 backdrop-filter 能真正模糊其背后的内容，形成可见的星点散景。

#### Scenario: Chrome 开启模糊可见散景
- **WHEN** 用户在 Chrome/Edge 中开启高斯模糊
- **AND** 模糊值 ≥ 20
- **THEN** 导航栏背景可见散布的星点散景光斑（非纯色或渐变）
- **AND** 侧边栏/文章卡片背景同样可见星点散景

#### Scenario: 滑块控制散景锐利度
- **WHEN** 模糊值 = 0
- **THEN** 星点锐利可见
- **WHEN** 模糊值 = 60
- **THEN** 星点扩散成中等散景光斑
- **WHEN** 模糊值 = 100
- **THEN** 星点扩散成大圆散景

### Requirement: Firefox 不受影响
系统 SHALL 在 Firefox 中隐藏 `.blur-source` 层，因为 Firefox 的 backdrop-filter 能穿透层叠上下文，无需本地模糊源。

#### Scenario: Firefox 正常显示
- **WHEN** 用户在 Firefox 中开启高斯模糊
- **THEN** backdrop-filter 正常生效（通过 body 层的 blur-bokeh-layer）
- **AND** .blur-source 的 opacity 为 0（不产生双重星点）

### Requirement: 每个层叠上下文都有模糊源
系统 SHALL 在每个创建了层叠上下文且包含 backdrop-filter 元素的容器内放置 .blur-source，确保所有模糊元素都能在 Chrome 中生效。

#### Scenario: 导航栏模糊源
- **WHEN** 页面加载完成
- **THEN** #top-row 内存在一个 .blur-source 元素
- **AND** 该元素在 blur-active 时 opacity > 0

#### Scenario: 内容卡片模糊源
- **WHEN** 页面加载完成
- **THEN** z-30 内容容器内存在一个 .blur-source 元素
- **AND** 该元素在 blur-active 时 opacity > 0

## ADDED Requirements

### Requirement: 自定义背景下的毛玻璃效果
系统 SHALL 确保在同时开启自定义背景和高斯模糊时，导航栏/卡片背景能模糊自定义背景图片本身，而不是显示星点或纯色。

#### Scenario: 自定义背景 + 高斯模糊
- **WHEN** 用户开启自定义背景并粘贴图片链接
- **AND** 用户开启高斯模糊
- **THEN** 卡片背景显示自定义背景图片的模糊版本（毛玻璃效果）
- **AND** 模糊值变化时，模糊程度随之变化

### Requirement: CSS 变量同步自定义背景 URL
系统 SHALL 在应用自定义背景时，将当前图片 URL 同步到 CSS 变量 `--custom-bg-url`，供 `.blur-source` 使用。

#### Scenario: URL 同步
- **WHEN** 用户设置自定义背景图片
- **THEN** `<html>` 的 `--custom-bg-url` 变量被设置为该图片的 url()
- **WHEN** 用户关闭自定义背景
- **THEN** `--custom-bg-url` 变量被移除

## MODIFIED Requirements

### Requirement: blur-source 样式
原方案：仅在 #top-row 内放置 .blur-source，position:absolute，height:4.5rem（只覆盖导航栏）。
修改为：.blur-source 通用样式，position:fixed，inset:0（全屏覆盖），在 #top-row 和 z-30 容器内各放置一个。

扩展：当 `html.custom-bg-active` 时，`.blur-source` 的背景图片改为 `var(--custom-bg-url)`，覆盖星点背景；未开启自定义背景时仍显示星点。

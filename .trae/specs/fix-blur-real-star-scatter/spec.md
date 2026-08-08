# 真正的高斯模糊散景（星点散景而非彩色渐变）Spec

## Why
当前高斯模糊方案虽让 `backdrop-filter: blur(120px)` 真正生效，但用户判定"还只是拉透明度再改"。根因有二：
1. **馈源层是大块彩色星云光斑**（`blur-bokeh-layer` 里 5 个径向渐变光斑），模糊后看起来像给导航栏换了张彩色渐变背景，而非"模糊了背后真实内容"。
2. **原始背景星点太暗太细**：`body::before` 仅 5 个 1px 亮点、opacity 0.42；流星 2px 高。深色夜空上，1px 亮点经 `blur(120px)` 高斯扩散后亮度降到约 1/14400，肉眼不可见——所以即使 `backdrop-filter` 生效，也糊不出可感知的散景，只感觉到那 40% 透明度变化。

要让"模糊度"真正可感知，必须让模糊作用于**高亮度、高密度的小亮点**，模糊后形成明显的"星点散景群"（像透过毛玻璃看星空），且滑块变化时散景锐利度有明显梯度。

## What Changes
- **改造 `blur-bokeh-layer`**（Layout.astro 全局样式）：移除大块彩色星云径向渐变光斑（易被误认为渐变背景），改为**密集高亮星点群**——大量 1.5–2.5px 的小亮点，高 alpha（0.85–1.0），300px 平铺重复。仅在 `html.blur-active` 时显示，模糊后形成明显的星点散景群。
- **增强真实背景星点**（`body::before`）：将星点数量从 5 个增加到 12+ 个，尺寸 1px→1.5–2px，alpha 提升，让默认（模糊关闭）状态下夜空更精致，且模糊开启时也参与散景。
- **保留模糊半径与滑块的线性映射**：`blur(calc(var(--blur-value) * 1.2px))` 已正确（0→无模糊，100→120px 最大散景），不改。确保 0 时星点锐利、100 时星点糊成大圆散景，肉眼梯度明显。
- **移除 `color-mix` 透明度对模糊的主导**：当前透明度随 blur-value 变化（50%–100%），会让用户误以为"滑块在调透明度"。改为透明度固定（如 55%），让模糊半径成为唯一变量，滑块变化只影响散景锐利度而非透明度。

## Impact
- Affected code:
  - `src/layouts/Layout.astro`（`blur-bokeh-layer` CSS、`body::before` 星点）
  - `src/styles/main.css`（`html.blur-active` 透明度规则，改为固定透明度）
- 不影响：流星雨动画、设置面板交互逻辑、localStorage 持久化、低性能模式降级。

## ADDED Requirements

### Requirement: 星点散景可感知
系统 SHALL 在开启高斯模糊时，让导航栏/卡片/浮层背后呈现明显的"星点散景群"——即模糊后可见散布的圆形光斑（焦外散景），而非均匀彩色渐变或纯半透明色块。

#### Scenario: 开启模糊可见散景
- **WHEN** 用户开启高斯模糊开关（blur-active 类挂载）
- **AND** 模糊值 ≥ 20
- **THEN** 导航栏背景可见散布的星点散景光斑，而非纯色或渐变

#### Scenario: 关闭模糊恢复纯净夜空
- **WHEN** 用户关闭高斯模糊
- **THEN** `blur-bokeh-layer` opacity 归 0，导航栏背景恢复原始深色夜空，无彩色光斑残留

### Requirement: 滑块控制散景锐利度
系统 SHALL 让模糊滑块（0–100）唯一控制 `backdrop-filter` 的 blur 半径，且透明度保持固定，确保滑块变化时肉眼感知到的是"散景从锐利变糊"，而非"透明度变化"。

#### Scenario: 滑块梯度可辨
- **WHEN** 模糊值 = 0
- **THEN** backdrop-filter 为 blur(0)，背后星点锐利可见
- **WHEN** 模糊值 = 50
- **THEN** backdrop-filter 为 blur(60px)，星点扩散成中等散景
- **WHEN** 模糊值 = 100
- **THEN** backdrop-filter 为 blur(120px)，星点扩散成大圆散景，几乎连成光晕

### Requirement: 默认背景不受污染
系统 SHALL 保证 `blur-bokeh-layer` 在模糊关闭时完全透明（opacity:0），不改变默认流星雨夜空的视觉。

#### Scenario: 默认状态零影响
- **WHEN** 模糊未开启
- **THEN** `blur-bokeh-layer` 不绘制任何内容，`body::before` 增强后的星点是唯一新增的默认背景变化

## MODIFIED Requirements

### Requirement: 模糊背景透明度
原规则：透明度随 blur-value 变化（`color-mix(in srgb, var(--card-bg) max(50%, 100% - var(--blur-value) * 0.5%), transparent)`），导致滑块同时调透明度和模糊度，用户感知混淆。
修改为：透明度固定为约 55%（`color-mix(in srgb, var(--card-bg) 55%, transparent)`），让模糊半径成为滑块唯一可感知变量。

## REMOVED Requirements

### Requirement: 大块彩色星云光斑
**Reason**: `blur-bokeh-layer` 中的 5 个大块彩色径向渐变光斑（蓝/紫色星云）模糊后像渐变背景，被用户判定为"透明度再改"而非真正模糊。
**Migration**: 替换为密集高亮小星点群，模糊后形成星点散景。

<script lang="ts">
import {
	getAnnouncementEnabled,
	getBlurTarget,
	getCustomBgBlur,
	getCustomBgBlurEnabled,
	getCustomBgEnabled,
	getCustomBgUrl,
	setAnnouncementEnabled,
	setBlurTarget,
	setCustomBgBlur,
	setCustomBgBlurEnabled,
	setCustomBgEnabled,
	setCustomBgUrl,
} from "@utils/setting-utils";

let customEnabled = getCustomBgEnabled();
let customUrl = getCustomBgUrl();
let blurEnabled = getCustomBgBlurEnabled();
let blurStrength = getCustomBgBlur();
let blurTarget = getBlurTarget();
let announcementEnabled = getAnnouncementEnabled();

function toggleCustomEnabled() {
	customEnabled = !customEnabled;
}

function toggleBlurEnabled() {
	blurEnabled = !blurEnabled;
}

function toggleAnnouncementEnabled() {
	announcementEnabled = !announcementEnabled;
}

// 数值输入框失焦/回车时，把超出范围或空值修正到合法区间，保持滑块与输入框一致
function handleBlurInput() {
	if (blurStrength === null || blurStrength === undefined || Number.isNaN(blurStrength)) {
		blurStrength = 0;
		return;
	}
	blurStrength = Math.min(40, Math.max(0, Math.round(blurStrength)));
}

// 使用 bind:value 让 Svelte 接管双向绑定。
// CSS 变量、localStorage 与 <html> 属性通过 reactive 语句同步。
$: setCustomBgEnabled(customEnabled);
$: setCustomBgUrl(customUrl);
$: setCustomBgBlurEnabled(blurEnabled);
$: setCustomBgBlur(blurStrength);
$: setBlurTarget(blurTarget);
$: setAnnouncementEnabled(announcementEnabled);
</script>

<div id="glass-setting" class="float-panel float-panel-closed absolute transition-[opacity,transform] w-80 right-4 px-4 py-4">
    <div class="flex flex-row items-center justify-between">
        <div class="flex font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.33rem]">
            自定义背景(Beta)
        </div>
        <button role="switch" aria-checked={customEnabled} aria-label="Toggle Custom Background" on:click={toggleCustomEnabled}
                class="toggle-switch bg-switch relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                class:bg-switch-on={customEnabled}>
            <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  class:translate-x-5={customEnabled} class:translate-x-0={!customEnabled}></span>
        </button>
    </div>
    {#if customEnabled}
        <div class="mt-3 px-1">
            <div class="text-sm text-neutral-700 dark:text-neutral-300 ml-3 mb-2">视频 / 图片链接（视频循环播放）</div>
            <input type="url" bind:value={customUrl}
                   placeholder="粘贴视频或图片链接"
                   aria-label="Custom Background URL"
                   class="custom-bg-input w-full rounded-md px-3 py-2 text-sm bg-transparent text-[var(--btn-content)] border border-[var(--line-color)] focus:border-[var(--primary)] focus:outline-none transition" />
        </div>
    {/if}
    <div class="flex flex-row items-center justify-between mt-3">
        <div class="flex items-center font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.33rem]">
            高斯模糊(Beta)
        </div>
        <button role="switch" aria-checked={blurEnabled} aria-label="Toggle Gaussian Blur" on:click={toggleBlurEnabled}
                class="toggle-switch bg-switch relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                class:bg-switch-on={blurEnabled}>
            <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  class:translate-x-5={blurEnabled} class:translate-x-0={!blurEnabled}></span>
        </button>
    </div>
    {#if blurEnabled}
        <div class="mt-3 px-1">
            <div class="flex flex-row items-center gap-2">
                <div class="flex-1 h-6 px-1 rounded select-none bg-[var(--btn-regular-bg)]">
                    <input type="range" min="0" max="40" step="1" bind:value={blurStrength}
                           aria-label="Gaussian Blur Strength"
                           id="blurSlider" class="blur-slider" style="width: 100%">
                </div>
                <input type="number" min="0" max="40" step="1" bind:value={blurStrength}
                       on:change={handleBlurInput} on:blur={handleBlurInput}
                       aria-label="Gaussian Blur Strength"
                       class="blur-num-input w-12 h-7 shrink-0 rounded-md text-center text-sm font-bold bg-[var(--btn-regular-bg)] text-[var(--btn-content)] border border-[var(--line-color)] focus:border-[var(--primary)] focus:outline-none transition" />
            </div>
            <div class="flex flex-row items-center justify-between mt-3">
                <div class="flex items-center font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3
                    before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
                    before:absolute before:-left-3 before:top-[0.33rem]">模糊对象</div>
                <div class="flex flex-1 flex-row overflow-hidden rounded-md border border-[var(--line-color)]">
                    <button type="button" on:click={() => (blurTarget = "card")}
                            aria-pressed={blurTarget === "card"}
                            class="blur-target-btn flex-1 px-1 py-1 text-xs font-bold transition"
                            class:active={blurTarget === "card"}>操作卡片</button>
                    <button type="button" on:click={() => (blurTarget = "bg")}
                            aria-pressed={blurTarget === "bg"}
                            class="blur-target-btn flex-1 px-1 py-1 text-xs font-bold transition border-l border-[var(--line-color)]"
                            class:active={blurTarget === "bg"}>背景</button>
                    <button type="button" on:click={() => (blurTarget = "both")}
                            aria-pressed={blurTarget === "both"}
                            class="blur-target-btn flex-1 px-1 py-1 text-xs font-bold transition border-l border-[var(--line-color)]"
                            class:active={blurTarget === "both"}>背景+卡片</button>
                </div>
            </div>
        </div>
    {/if}
    <div class="flex flex-row items-center justify-between mt-3">
        <div class="flex items-center font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.33rem]">
            公告（小喇叭）显示
        </div>
        <button role="switch" aria-checked={announcementEnabled} aria-label="Toggle Announcement Float" on:click={toggleAnnouncementEnabled}
                class="toggle-switch bg-switch relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                class:bg-switch-on={announcementEnabled}>
            <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  class:translate-x-5={announcementEnabled} class:translate-x-0={!announcementEnabled}></span>
        </button>
    </div>
</div>


<style lang="stylus">
    #glass-setting
      .toggle-switch
        background rgba(0, 0, 0, 0.25)
        :global(.dark) &
          background rgba(255, 255, 255, 0.2)
        &.bg-switch-on
          background var(--primary)

      /* 模糊对象选择按钮（操作卡片 / 背景 / 背景+卡片） */
      .blur-target-btn
        background transparent
        color var(--btn-content)
        &:hover
          opacity 0.75
        &.active
          background var(--primary)
          color white

      /* 隐藏 number 输入框的上下箭头（spinner） */
      .blur-num-input
        -moz-appearance textfield
        appearance textfield
        &::-webkit-inner-spin-button, &::-webkit-outer-spin-button
          -webkit-appearance none
          margin 0
        &::-moz-number-spin-box
          display none

      .blur-slider
        -webkit-appearance none
        height 1.5rem
        background transparent

        /* Input Thumb - WebKit (Chrome / Edge / Safari) */
        &::-webkit-slider-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          cursor pointer
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

        /* Input Thumb - Firefox */
        &::-moz-range-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          border-width 0
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          cursor pointer
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

        /* Input Thumb - IE / Edge Legacy */
        &::-ms-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)
</style>

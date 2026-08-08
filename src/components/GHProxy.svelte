<script lang="ts">
import Icon from "@iconify/svelte";
import { onDestroy, onMount } from "svelte";

const LS_BATCH_KEY = "gh-proxy-batch-mode";
const LS_INPUT_KEY = "gh-proxy-input";

let inputUrl = "";
let outputUrl = "";
let selectedSource = "hk-gh-proxy";
let batchMode = false;
let toastEl: HTMLDivElement | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
// 记忆已恢复标志：恢复完成前不写入 localStorage，避免初始空值覆盖记忆
let hydrated = false;

onMount(() => {
	// 恢复记忆：批量开关状态 + 上次输入内容
	try {
		const savedBatch = localStorage.getItem(LS_BATCH_KEY);
		if (savedBatch === "1") batchMode = true;
		const savedInput = localStorage.getItem(LS_INPUT_KEY);
		if (savedInput !== null) inputUrl = savedInput;
	} catch {
		// localStorage 不可用时静默降级
	}
	hydrated = true;
});

// 记忆：输入内容与批量开关状态持久化，刷新/重进页面自动恢复
$: {
	if (hydrated && typeof localStorage !== "undefined") {
		try {
			localStorage.setItem(LS_INPUT_KEY, inputUrl);
			localStorage.setItem(LS_BATCH_KEY, batchMode ? "1" : "0");
		} catch {
			// ignore
		}
	}
}

function generate() {
	const val = inputUrl.trim();
	if (!val) {
		showToast("请先输入链接");
		return;
	}
	const prefix = selectedSource === "hk-gh-proxy" ? "https://hk.gh-proxy.com/" : "https://gh-proxy.com/";
	if (batchMode) {
		// 批量模式：每行一个地址，逐行加前缀，忽略空行
		const lines = val
			.split(/\r?\n/)
			.map((l) => l.trim())
			.filter((l) => l.length > 0);
		if (lines.length === 0) {
			showToast("请先输入链接");
			return;
		}
		outputUrl = lines.map((l) => `${prefix}${l}`).join("\n");
	} else {
		outputUrl = `${prefix}${val}`;
	}
}

function copy() {
	if (!outputUrl) {
		showToast("请先生成链接");
		return;
	}
	navigator.clipboard
		.writeText(outputUrl)
		.then(() => {
			showToast("已复制到剪贴板");
		})
		.catch(() => {
			// fallback
			const ta = document.createElement("textarea");
			ta.value = outputUrl;
			ta.style.position = "fixed";
			ta.style.opacity = "0";
			document.body.appendChild(ta);
			ta.select();
			document.execCommand("copy");
			document.body.removeChild(ta);
			showToast("已复制到剪贴板");
		});
}

function download() {
	if (!outputUrl) return;
	if (batchMode) {
		// 批量模式下一键下载所有链接（逐个新窗口打开）
		outputUrl
			.split(/\r?\n/)
			.map((l) => l.trim())
			.filter((l) => l.length > 0)
			.forEach((l) => window.open(l, "_blank"));
	} else {
		window.open(outputUrl, "_blank");
	}
}

function clearAll() {
	inputUrl = "";
	outputUrl = "";
	// 清空时同步清除记忆的输入内容
	try {
		localStorage.removeItem(LS_INPUT_KEY);
	} catch {
		// ignore
	}
}

/**
 * Toast 直接挂载到 <body> 下，而不是组件内部。
 * 组件位于页面的 .z-30 内容容器（z-index + position 会创建层叠上下文）内，
 * 若 Toast 渲染在组件中，其 z-index:9999 会被困在该层叠上下文里，
 * 低于导航栏 #top-row 的 z-50，导致提示框被导航栏盖住。
 * 挂到 <body> 后 Toast 以根层叠上下文参与比较，z-9999 必然置顶。
 */
function showToast(msg: string) {
	if (!toastEl) {
		toastEl = document.createElement("div");
		toastEl.className = "gh-toast";
		document.body.appendChild(toastEl);
	}
	toastEl.textContent = msg;
	// 强制回流，确保连续触发时过渡动画能重新播放
	void toastEl.offsetWidth;
	toastEl.classList.add("gh-toast-show");
	if (toastTimer) clearTimeout(toastTimer);
	toastTimer = setTimeout(() => {
		toastEl?.classList.remove("gh-toast-show");
	}, 1500);
}

onDestroy(() => {
	if (toastTimer) clearTimeout(toastTimer);
	toastEl?.remove();
	toastEl = null;
});
</script>

<div class="card-base z-10 px-6 md:px-9 py-6 relative w-full">
  <div class="flex items-center gap-2 mb-6">
    <Icon icon="mdi:github" class="text-2xl text-[var(--primary)]" />
    <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">GitHub 反代链接生成器</h1>
  </div>
  <p class="text-neutral-500 dark:text-neutral-400 mb-6">输入 GitHub 原始链接，选择反代源，点击生成</p>

  <div class="space-y-5">
    <!-- 反代源选择按钮 -->
    <div>
      <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">反代源</label>
      <div class="flex gap-3">
        <button
          class="flex-1 px-4 py-2.5 rounded-lg font-medium border-2 transition-all active:scale-95"
          class:bg-[var(--primary)]={selectedSource === "hk-gh-proxy"}
          class:text-white={selectedSource === "hk-gh-proxy"}
          class:border-[var(--primary)]={selectedSource === "hk-gh-proxy"}
          class:bg-neutral-100={selectedSource !== "hk-gh-proxy"}
          class:dark:bg-neutral-800={selectedSource !== "hk-gh-proxy"}
          class:border-neutral-200={selectedSource !== "hk-gh-proxy"}
          class:dark:border-neutral-700={selectedSource !== "hk-gh-proxy"}
          class:text-neutral-900={selectedSource !== "hk-gh-proxy"}
          class:dark:text-neutral-100={selectedSource !== "hk-gh-proxy"}
          on:click={() => { selectedSource = "hk-gh-proxy"; }}
        >
          hk.gh-proxy.com「推荐」
        </button>
        <button
          class="flex-1 px-4 py-2.5 rounded-lg font-medium border-2 transition-all active:scale-95"
          class:bg-[var(--primary)]={selectedSource === "gh-proxy"}
          class:text-white={selectedSource === "gh-proxy"}
          class:border-[var(--primary)]={selectedSource === "gh-proxy"}
          class:bg-neutral-100={selectedSource !== "gh-proxy"}
          class:dark:bg-neutral-800={selectedSource !== "gh-proxy"}
          class:border-neutral-200={selectedSource !== "gh-proxy"}
          class:dark:border-neutral-700={selectedSource !== "gh-proxy"}
          class:text-neutral-900={selectedSource !== "gh-proxy"}
          class:dark:text-neutral-100={selectedSource !== "gh-proxy"}
          on:click={() => { selectedSource = "gh-proxy"; }}
        >
          gh-proxy.com
        </button>
      </div>
    </div>

    <!-- 批量模式开关 -->
    <div class="flex items-center justify-between">
      <div>
        <div class="text-sm font-medium text-neutral-700 dark:text-neutral-300">批量模式</div>
        <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">开启后每行粘贴一个 GitHub 链接，支持一次生成与复制全部</div>
      </div>
      <button
        role="switch"
        aria-checked={batchMode}
        aria-label="Toggle Batch Mode"
        on:click={() => { batchMode = !batchMode; }}
        class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-black/25 dark:bg-white/20"
        class:bg-[var(--primary)]={batchMode}
      >
        <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              class:translate-x-5={batchMode} class:translate-x-0={!batchMode}></span>
      </button>
    </div>

    <!-- 原始链接输入 -->
    <div>
      <label for="gh-input" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">原始链接</label>
      {#if batchMode}
        <textarea
          id="gh-input"
          bind:value={inputUrl}
          rows="6"
          placeholder={"每行一个 GitHub 链接，例如：\nhttps://github.com/user/repo/releases/download/v1.0/file.zip\nhttps://github.com/user/repo/raw/main/script.sh"}
          class="w-full px-4 py-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all resize-y overflow-y-auto min-h-[8rem] leading-relaxed"
        ></textarea>
      {:else}
        <input
          id="gh-input"
          type="text"
          bind:value={inputUrl}
          placeholder="https://github.com/user/repo/releases/download/v1.0/file.zip"
          class="w-full px-4 py-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
        />
      {/if}
    </div>

    <!-- 生成按钮 -->
    <button
      on:click={generate}
      class="w-full px-4 py-2.5 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 active:scale-95 transition-all"
    >
      {batchMode ? "批量生成反代链接" : "生成反代链接"}
    </button>

    <!-- 反代链接输出 -->
    <div>
      <label for="gh-output" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">反代链接</label>
      {#if batchMode}
        <textarea
          id="gh-output"
          readonly
          value={outputUrl}
          rows="6"
          placeholder="点击上方「批量生成反代链接」按钮"
          class="w-full px-4 py-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none resize-y overflow-y-auto min-h-[8rem] leading-relaxed"
        ></textarea>
      {:else}
        <input
          id="gh-output"
          type="text"
          readonly
          value={outputUrl}
          placeholder="点击上方「生成反代链接」按钮"
          class="w-full px-4 py-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none"
        />
      {/if}
    </div>

    <!-- 操作按钮 -->
    <div class="flex gap-3">
      <button
        on:click={copy}
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 active:scale-95 transition-all"
      >
        <Icon icon="material-symbols:content-copy" class="text-lg" />
        <span>{batchMode ? "一键复制全部" : "一键复制"}</span>
      </button>
      <button
        on:click={download}
        disabled={!outputUrl}
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Icon icon="material-symbols:download" class="text-lg" />
        <span>一键下载</span>
      </button>
      <button
        on:click={clearAll}
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium hover:opacity-90 active:scale-95 transition-all"
      >
        <Icon icon="material-symbols:close" class="text-lg" />
        <span>清空</span>
      </button>
    </div>
  </div>
</div>

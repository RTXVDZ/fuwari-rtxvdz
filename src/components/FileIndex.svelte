<script lang="ts">
import Icon from "@iconify/svelte";
import { onMount } from "svelte";

type FileItem = { n: string; d: string; s: number; t: string; l?: string };
type Group = { name: string; files: FileItem[] };

const EXT_MAP: Record<string, string[]> = {
	archive: ["zip", "rar", "7z", "tar", "gz"],
	pdf: ["pdf"],
	document: ["doc", "docx"],
	sheet: ["xls", "xlsx", "csv"],
	slide: ["ppt", "pptx"],
	image: ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"],
	video: ["mp4", "mov", "avi", "mkv", "wmv"],
	audio: ["mp3", "flac", "wav", "aac", "ogg", "m4a"],
	code: ["js", "ts", "py", "css", "html", "json", "xml", "sh", "java", "go", "rs"],
	text: ["txt", "md", "log", "ini"],
};
const LABEL: Record<string, string> = {
	archive: "压缩包", pdf: "PDF", document: "文档", sheet: "表格", slide: "演示",
	image: "图片", video: "视频", audio: "音频", code: "代码", text: "文本",
};
const COLOR: Record<string, string> = {
	archive: "#E09A3E", pdf: "#E25C5C", document: "#3E9BB2", sheet: "#43A07A",
	slide: "#E8734A", image: "#E05A8F", video: "#B4549C", audio: "#9B7BDE",
	code: "#6E8B3D", text: "#8A7A66",
};
const ICON: Record<string, string> = {
	archive: "mdi:zip-box", pdf: "mdi:file-pdf-box", document: "mdi:file-word",
	sheet: "mdi:file-excel", slide: "mdi:file-powerpoint", image: "mdi:file-image",
	video: "mdi:file-video", audio: "mdi:file-music", code: "mdi:file-code", text: "mdi:file-document",
};
const TYPES = ["全部", ...Object.keys(LABEL)];

let all: FileItem[] = [];
let files: FileItem[] = [];
let grouped: Group[] = [];
let q = "";
let type = "全部";
let sort = "name";
let asc = true;
let loading = true;
let error = "";
let apiBase = "";

function extOf(name: string) {
	const m = name.match(/\.([^.]+)$/);
	return m ? m[1].toLowerCase() : "";
}
function catOf(name: string) {
	const e = extOf(name);
	for (const k in EXT_MAP) if (EXT_MAP[k].includes(e)) return k;
	return "text";
}
function fmtSize(b: number) {
	if (b >= 1e9) return (b / 1e9).toFixed(1) + " GB";
	if (b >= 1e6) return (b / 1e6).toFixed(1) + " MB";
	if (b >= 1e3) return Math.round(b / 1e3) + " KB";
	return b + " B";
}
function relPath(f: FileItem) {
	return f.d ? f.d + "/" + f.n : f.n;
}
function fileUrl(f: FileItem) {
	if (f.l) return f.l; // 外链文件直接跳外部链接
	const p = relPath(f).split("/").map(encodeURIComponent).join("/");
	return (apiBase ? apiBase + "/" : "/") + p;
}
function copyPath(f: FileItem) {
	const p = f.l || relPath(f); // 外链文件复制外链
	navigator.clipboard
		.writeText(p)
		.then(() => toast((f.l ? "已复制链接：" : "已复制路径：") + p))
		.catch(() => toast("复制失败"));
}

let toastEl: HTMLDivElement | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
function toast(msg: string) {
	if (!toastEl) {
		toastEl = document.createElement("div");
		toastEl.className = "fileindex-toast";
		document.body.appendChild(toastEl);
	}
	toastEl.textContent = msg;
	void toastEl.offsetWidth;
	toastEl.classList.add("fileindex-toast-show");
	if (toastTimer) clearTimeout(toastTimer);
	toastTimer = setTimeout(() => toastEl?.classList.remove("fileindex-toast-show"), 1500);
}

onMount(async () => {
	// API 根地址解析：localStorage 覆盖 > 环境变量 PUBLIC_FILE_INDEX_API > 同域 /api/files
	let override = "";
	try {
		override = localStorage.getItem("fileIndexApi") || "";
	} catch {
		// ignore
	}
	const envApi = (import.meta.env.PUBLIC_FILE_INDEX_API as string) || "";
	apiBase = (override || envApi || "").replace(/\/$/, "");
	const url = (apiBase ? apiBase + "/api/files" : "/api/files");
	try {
		const r = await fetch(url, { cache: "no-store" });
		if (!r.ok) throw new Error("HTTP " + r.status);
		const data = await r.json();
		all = Array.isArray(data) ? data : [];
		loading = false;
		if (!all.length) error = "当前没有可展示的文件";
	} catch {
		loading = false;
		error = "无法获取文件列表，请检查 API 地址";
	}
});

$: {
	let list = all;
	const t = q.trim().toLowerCase();
	if (t) {
		list = list.filter(
			(f) => f.n.toLowerCase().includes(t) || relPath(f).toLowerCase().includes(t),
		);
	}
	if (type !== "全部") list = list.filter((f) => catOf(f.n) === type);
	const dir = asc ? 1 : -1;
	list = [...list].sort((a, b) => {
		if (sort === "name") return a.n.localeCompare(b.n, "zh") * dir;
		if (sort === "size") return (a.s - b.s) * dir;
		return a.t.localeCompare(b.t) * dir;
	});
	files = list;
	const map = new Map<string, FileItem[]>();
	for (const f of list) {
		const k = f.d || "根目录";
		if (!map.has(k)) map.set(k, []);
		map.get(k)!.push(f);
	}
	grouped = [...map.entries()]
		.sort((a, b) =>
			a[0] === "根目录" ? -1 : b[0] === "根目录" ? 1 : a[0].localeCompare(b[0], "zh"),
		)
		.map(([name, fs]) => ({ name, files: fs }));
}
</script>

<div class="card-base z-10 px-6 md:px-9 py-6 relative w-full">
	<div class="flex items-center gap-2 mb-2">
		<Icon icon="mdi:folder-multiple-outline" class="text-2xl text-[var(--primary)]" />
		<h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">文件索引</h1>
	</div>
	<p class="text-neutral-500 dark:text-neutral-400 mb-6">浏览与下载项目文件</p>

	{#if loading}
		<div class="py-16 text-center text-neutral-500 dark:text-neutral-400">加载中…</div>
	{:else if error}
		<div class="py-16 text-center text-neutral-500 dark:text-neutral-400">{error}</div>
	{:else}
		<!-- 工具栏 -->
		<div class="flex flex-wrap gap-3 mb-4">
			<input
				type="text"
				bind:value={q}
				placeholder="搜索文件名…"
				class="flex-1 min-w-48 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
			/>
			<select
				bind:value={sort}
				class="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none"
			>
				<option value="name">按名称</option>
				<option value="size">按大小</option>
				<option value="date">按日期</option>
			</select>
			<button
				on:click={() => (asc = !asc)}
				class="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium hover:opacity-90 active:scale-95 transition-all"
			>
				{asc ? "升序 ↑" : "降序 ↓"}
			</button>
		</div>

		<!-- 类型筛选 -->
		<div class="flex flex-wrap gap-2 mb-5">
			{#each TYPES as tp}
				<button
					on:click={() => (type = tp)}
					class="px-3 py-1.5 rounded-full text-sm font-medium border transition-all active:scale-95"
					class:bg-[var(--primary)]={type === tp}
					class:text-white={type === tp}
					class:border-[var(--primary)]={type === tp}
					class:bg-neutral-100={type !== tp}
					class:dark:bg-neutral-800={type !== tp}
					class:border-neutral-200={type !== tp}
					class:dark:border-neutral-700={type !== tp}
					class:text-neutral-700={type !== tp}
					class:dark:text-neutral-300={type !== tp}
				>{tp === "全部" ? "全部" : LABEL[tp]}</button
				>
			{/each}
		</div>

		<p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
			共 {all.length} 个文件 · 显示 {files.length} 个 · {grouped.length} 个目录
		</p>

		<!-- 分组列表 -->
		{#each grouped as g}
			<div class="mb-6">
				<div class="flex items-center gap-2 mb-3">
					<Icon icon="mdi:folder-outline" class="text-xl text-[var(--primary)]" />
					<h2 class="text-lg font-bold text-neutral-900 dark:text-neutral-100">{g.name}</h2>
					<span class="text-xs text-neutral-400">{g.files.length} 个</span>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
					{#each g.files as f}
						<a
							href={fileUrl(f)}
							target="_blank"
							rel="noopener"
							class="group flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 hover:border-[var(--primary)] hover:shadow-md transition-all"
						>
							<span
								class="shrink-0 w-10 h-10 rounded-lg grid place-items-center"
								style="background:{COLOR[catOf(f.n)]}1a;color:{COLOR[catOf(f.n)]}"
							>
								<Icon icon={ICON[catOf(f.n)] || "mdi:file"} class="text-xl" />
							</span>
							<span class="min-w-0 flex-1">
								<span class="flex items-center gap-1.5 min-w-0">
									<span class="truncate font-medium text-sm text-neutral-900 dark:text-neutral-100" title={f.n}>{f.n}</span>
									{#if f.l}<span class="shrink-0 text-[10px] leading-none px-1.5 py-0.5 rounded-full text-white" style="background:var(--primary)">外链</span>{/if}
								</span>
								<span class="block text-xs text-neutral-400 mt-0.5">{f.l ? (f.s > 0 ? (f.s / 1048576).toFixed(2) + " MB" : "未知") : (f.s > 0 ? fmtSize(f.s) : "未知")}{f.t ? " · " + f.t : ""}</span>
							</span>
							<button
								on:click|stopPropagation|preventDefault={() => copyPath(f)}
								class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400"
								title="复制路径"
							><Icon icon="mdi:content-copy" class="text-base" /></button
							>
						</a>
					{/each}
				</div>
			</div>
		{/each}

		{#if files.length === 0}
			<div class="py-16 text-center text-neutral-500 dark:text-neutral-400">没有匹配的文件</div>
		{/if}
	{/if}
</div>

<style>
	:global(.fileindex-toast) {
		position: fixed;
		left: 50%;
		bottom: 24px;
		transform: translate(-50%, 16px);
		background: #13151a;
		color: #fff;
		padding: 10px 18px;
		border-radius: 10px;
		font-size: 14px;
		z-index: 9999;
		opacity: 0;
		transition: all 0.3s;
	}
	:global(.fileindex-toast-show) {
		opacity: 1;
		transform: translate(-50%, 0);
	}
</style>

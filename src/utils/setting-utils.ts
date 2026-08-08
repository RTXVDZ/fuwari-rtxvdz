import {
	AUTO_MODE,
	DARK_MODE,
	DEFAULT_THEME,
	LIGHT_MODE,
} from "@constants/constants.ts";
import { expressiveCodeConfig, siteConfig } from "@/config";
import type { LIGHT_DARK_MODE } from "@/types/config";

export function getDefaultHue(): number {
	const fallback = "250";
	const configCarrier = document.getElementById("config-carrier");
	return Number.parseInt(configCarrier?.dataset.hue || fallback, 10);
}

export function getHue(): number {
	const stored = localStorage.getItem("hue");
	return stored ? Number.parseInt(stored, 10) : getDefaultHue();
}

export function setHue(hue: number): void {
	localStorage.setItem("hue", String(hue));
	const r = document.querySelector(":root") as HTMLElement;
	if (!r) {
		return;
	}
	r.style.setProperty("--hue", String(hue));
}

export function applyThemeToDocument(theme: LIGHT_DARK_MODE) {
	// 如果强制使用暗色模式，则忽略其他设置
	if (siteConfig.themeColor.forceDarkMode) {
		document.documentElement.classList.add("dark");
	} else {
		// 否则按照用户设置或系统偏好
		switch (theme) {
			case LIGHT_MODE:
				document.documentElement.classList.remove("dark");
				break;
			case DARK_MODE:
				document.documentElement.classList.add("dark");
				break;
			case AUTO_MODE:
				if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
					document.documentElement.classList.add("dark");
				} else {
					document.documentElement.classList.remove("dark");
				}
				break;
		}
	}

	// Set the theme for Expressive Code
	document.documentElement.setAttribute(
		"data-theme",
		expressiveCodeConfig.theme,
	);
}

export function setTheme(theme: LIGHT_DARK_MODE): void {
	// 如果强制使用暗色模式，则不需要存储主题设置
	if (!siteConfig.themeColor.forceDarkMode) {
		localStorage.setItem("theme", theme);
	}
	applyThemeToDocument(theme);
}

export function getStoredTheme(): LIGHT_DARK_MODE {
	// 如果强制使用暗色模式，则始终返回暗色模式
	if (siteConfig.themeColor.forceDarkMode) {
		return DARK_MODE;
	}
	return (localStorage.getItem("theme") as LIGHT_DARK_MODE) || DEFAULT_THEME;
}

/* ---- 自定义背景（视频或图片） ---- */

/** 判断 URL 是否明显为图片（按扩展名） */
function isImageUrl(url: string): boolean {
	try {
		const u = new URL(url, window.location.href);
		return /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(u.pathname);
	} catch {
		return /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(url);
	}
}

/** 清理指定背景元素的 src 与显示 */
function resetEl(el: HTMLElement | null): void {
	if (el instanceof HTMLVideoElement) {
		el.pause();
		el.removeAttribute("src");
		el.load();
	} else if (el instanceof HTMLImageElement) {
		el.removeAttribute("src");
	}
	if (el) el.style.display = "none";
}

/**
 * 背景加载彻底失败：清理元素并回退。
 * 关键：必须移除 `custom-bg-active` 类并清掉失效的存储设置，
 * 否则流星雨会因 `html.custom-bg-active .meteor-shower { display: none }`
 * 被永久隐藏（即使背景图本身加载失败、页面看起来没有任何背景）。
 */
function failBg(video: HTMLVideoElement | null, img: HTMLImageElement | null): void {
	resetEl(video);
	resetEl(img);
	document.documentElement.classList.remove("custom-bg-active");
	lastBgActive = false;
	lastBgUrl = "";
	localStorage.removeItem("custom-bg-url");
	localStorage.setItem("custom-bg-enabled", "false");
}

/** 尝试用 video 加载，失败则回退到 img */
function activateVideo(url: string, video: HTMLVideoElement, img: HTMLImageElement): void {
	const onErr = () => {
		video.removeEventListener("loadedmetadata", onLoaded);
		resetEl(video);
		// video 加载失败，可能是图片但扩展名不明确，用 img 重试
		img.referrerPolicy = "no-referrer";
		img.addEventListener("error", () => failBg(video, img), { once: true });
		img.src = url;
		img.style.display = "";
	};
	const onLoaded = () => {
		video.removeEventListener("error", onErr);
	};
	// 使用 { once: true } 并在成功后互清 listener，避免 swup 切页或多次
	// 设置 URL 时旧 listener 累积导致反复 reset/reload（用户感知的“刷新”）。
	video.addEventListener("error", onErr, { once: true });
	video.addEventListener("loadedmetadata", onLoaded, { once: true });
	// 显式设置循环属性，防止某些浏览器在 loop attribute 上失效
	video.loop = true;
	video.muted = true;
	video.playsInline = true;
	video.src = url;
	video.load();
	video.style.display = "";
	void video.play().catch(() => {});
}

/** 用 img 标签加载图片（<img> 不受 ORB 拦截，fetch 会被拦截） */
function activateImage(url: string, video: HTMLVideoElement, img: HTMLImageElement): void {
	const onErr = () => {
		failBg(video, img);
	};
	img.addEventListener("error", onErr, { once: true });
	// 显式设置 referrerPolicy 防止热链保护 403
	img.referrerPolicy = "no-referrer";
	img.src = url;
	img.style.display = "";
}

/** 上次应用的状态，避免重复 load/play 导致视频循环时被反复重置 */
let lastBgActive: boolean | null = null;
let lastBgUrl = "";

/** 将自定义背景开关与 URL 同步到 <html> 类与背景元素（video 或 img） */
export function applyCustomBg(enabled: boolean, url: string): void {
	const r = document.documentElement;
	const trimmed = url.trim();
	const active = enabled && trimmed.length > 0;

	// 状态去重：enabled 和 url 都没变时跳过，避免视频被反复 load/play
	if (lastBgActive === active && lastBgUrl === trimmed) return;
	lastBgActive = active;
	lastBgUrl = trimmed;

	r.classList.toggle("custom-bg-active", active);

	const video = document.getElementById("custom-bg-video") as HTMLVideoElement | null;
	const img = document.getElementById("custom-bg-img") as HTMLImageElement | null;

	// 重置两者
	resetEl(video);
	resetEl(img);

	if (!active || !video || !img) return;

	// 按扩展名判断；无法判断时默认走 video，失败自动回退 img
	if (isImageUrl(trimmed)) {
		activateImage(trimmed, video, img);
	} else {
		activateVideo(trimmed, video, img);
	}
}

export function getCustomBgEnabled(): boolean {
	return localStorage.getItem("custom-bg-enabled") === "true";
}

export function getCustomBgUrl(): string {
	return localStorage.getItem("custom-bg-url") || "";
}

export function setCustomBgEnabled(enabled: boolean): void {
	localStorage.setItem("custom-bg-enabled", String(enabled));
	applyCustomBg(enabled, getCustomBgUrl());
}

export function setCustomBgUrl(url: string): void {
	localStorage.setItem("custom-bg-url", url);
	applyCustomBg(getCustomBgEnabled(), url);
}

export function loadCustomBg(): void {
	applyCustomBg(getCustomBgEnabled(), getCustomBgUrl());
}

/* ---- 自定义背景高斯模糊 ---- */

/** 默认模糊强度（px），18px 让毛玻璃在深色背景下清晰可见 */
export const DEFAULT_BG_BLUR = 18;

/** 读取高斯模糊开关状态，默认关闭（与自定义背景开关相互独立） */
export function getCustomBgBlurEnabled(): boolean {
	return localStorage.getItem("custom-bg-blur-enabled") === "true";
}

/** 设置高斯模糊开关状态（同步 <html> 属性供 CSS 控制模糊效果） */
export function setCustomBgBlurEnabled(enabled: boolean): void {
	localStorage.setItem("custom-bg-blur-enabled", String(enabled));
	document.documentElement.dataset.blurEnabled = String(enabled);
}

/** 读取高斯模糊强度（px），无存储时返回默认值 */
export function getCustomBgBlur(): number {
	const stored = localStorage.getItem("custom-bg-blur");
	if (stored === null) {
		return DEFAULT_BG_BLUR;
	}
	const parsed = Number.parseInt(stored, 10);
	return Number.isNaN(parsed) ? DEFAULT_BG_BLUR : parsed;
}

/** 设置高斯模糊强度（px），同步 localStorage 与全局 CSS 变量 --custom-bg-blur */
export function setCustomBgBlur(blur: number): void {
	const clamped = Math.min(40, Math.max(0, Math.round(blur)));
	localStorage.setItem("custom-bg-blur", String(clamped));
	const r = document.querySelector(":root") as HTMLElement | null;
	if (r) {
		// --custom-bg-blur：带单位，用于 filter: blur()
		// --custom-bg-blur-num：纯数字，用于 scale() 边缘遮盖计算（兼容旧版浏览器 calc）
		r.style.setProperty("--custom-bg-blur", `${clamped}px`);
		r.style.setProperty("--custom-bg-blur-num", String(clamped));
	}
}

/** 在绘制前应用已保存的模糊强度，避免 FOUC */
export function loadCustomBgBlur(): void {
	const r = document.querySelector(":root") as HTMLElement | null;
	if (r) {
		setCustomBgBlur(getCustomBgBlur());
	}
}

/** 高斯模糊对象：card = 操作卡片（毛玻璃卡片），bg = 自定义背景（图片/视频），both = 背景与卡片同时模糊 */
export type BlurTarget = "card" | "bg" | "both";

/** 默认模糊对象：操作卡片（不依赖自定义背景，开关独立生效） */
export const DEFAULT_BLUR_TARGET: BlurTarget = "card";

/** 读取模糊对象，无存储时返回默认值 */
export function getBlurTarget(): BlurTarget {
	const stored = localStorage.getItem("custom-bg-blur-target");
	return stored === "bg" ? "bg" : stored === "both" ? "both" : DEFAULT_BLUR_TARGET;
}

/** 设置模糊对象，同步 localStorage 与 <html> 的 data-blur-target 属性（CSS 选择器入口） */
export function setBlurTarget(target: BlurTarget): void {
	localStorage.setItem("custom-bg-blur-target", target);
	const r = document.documentElement as HTMLElement | null;
	if (r) {
		r.dataset.blurTarget = target;
	}
}

/** 在绘制前应用已保存的模糊对象，避免 FOUC */
export function loadBlurTarget(): void {
	const r = document.documentElement as HTMLElement | null;
	if (r) {
		r.dataset.blurTarget = getBlurTarget();
	}
}

/* ---- 公告喇叭 ---- */

/** 读取公告喇叭显示开关，默认显示（实际渲染仍受 announcementConfig.enable 控制） */
export function getAnnouncementEnabled(): boolean {
	return localStorage.getItem("announcement-enabled") !== "false";
}

/** 设置公告喇叭显示开关，同步 localStorage 与 <html> 的 data-announcement-enabled 属性（CSS 选择器入口） */
export function setAnnouncementEnabled(enabled: boolean): void {
	localStorage.setItem("announcement-enabled", String(enabled));
	const r = document.documentElement as HTMLElement | null;
	if (r) {
		r.dataset.announcementEnabled = String(enabled);
	}
}

/** 在绘制前应用已保存的公告喇叭开关，避免 FOUC */
export function loadAnnouncementEnabled(): void {
	const r = document.documentElement as HTMLElement | null;
	if (r) {
		r.dataset.announcementEnabled = String(getAnnouncementEnabled());
	}
}

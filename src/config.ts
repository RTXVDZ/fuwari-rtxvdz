import type {
	AnnouncementConfig,
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config"; // 导入站点配置相关的 TypeScript 类型定义
import { LinkPreset } from "./types/config"; // 导入导航链接预设枚举

export const siteConfig: SiteConfig = {
	title: "Onlyfork依托小肥物", // 站点标题
	lang: "zh_CN", // 站点默认语言（如 zh_CN、en、ja 等）
	themeColor: {
		hue: 275, // 主题色相（0-360）
		fixed: true, // 是否固定主题色（true 表示对访客隐藏调色器）
		forceDarkMode: true, // 是否强制暗色主题
	},
	meteorShower: {
		enable: true, // 是否启用流星雨背景特效
		meteorCount: 6, // 流星数量（建议 2-6，越高越耗性能）
		brightness: 1.06, // 背景亮度系数（1 为默认，范围建议 0.8-1.4）
		baseDurationSec: 18, // 单颗流星基础动画时长（秒，越大越平滑）
	},
	toc: {
		enable: true, // 是否启用右侧目录（TOC）
		depth: 2, // 目录最大标题层级（1-3）
	},
	favicon: [
		{
			src: "https://q2.qlogo.cn/headimg_dl?dst_uin=334063894&spec=0&v=3", // 网站图标路径（相对 /public）；v = 1 为缓存版本号，头像更新时递增
			theme: "light", // 对应主题（light / dark，可选）
			sizes: "32x32", // 图标尺寸声明（可选）
		},
	],
	umamiEnabled: import.meta.env.PROD, // Umami 统计开关：true=启用（加载统计脚本并显示统计组件），false=禁用（本地开发时建议设为 false），import.meta.env.PROD为识别是否为生产环境
	banner: {
		enable: false, // 是否启用顶部横幅
		src: "https://lz.qaiu.top/parser?url=https://www.lanzout.com/iFvB63aq595e&pwd=6666", // 横幅图片地址（支持外链）
		position: "center", // 横幅图片对齐位置（top / center / bottom）
		credit: {
			enable: true, // 是否显示横幅来源信息
			text: "rtxvdz", // 横幅来源显示文案
			url: "https://lz.qaiu.top/parser?url=https://www.lanzout.com/iFvB63aq595e&pwd=6666", // 横幅来源跳转链接（可选）
		},
	},
};
export const navBarConfig: NavBarConfig = {
	links: [
		//{
		//	name: "更新日志", // 导航名称：更新日志
		//	url: "/updatelog/", // 站内链接（不需要写 base 前缀）
		//	external: false, // 是否为外链（false 表示站内）
		//},
		LinkPreset.Home, // 首页
		LinkPreset.Archive, // 归档页
		LinkPreset.About, // 关于页
		{
			name: "友链", // 导航名称：友链
			url: "/friends/", // 站内链接（不需要写 base 前缀）
			external: false, // 是否为外链（false 表示站内）
		},
		{
			name: "GH加速下载", // 导航名称：GitHub反代
			url: "/gh-proxy/", // 站内链接
			external: false, // 是否为外链（false 表示站内）
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "https://q2.qlogo.cn/headimg_dl?dst_uin=334063894&spec=0&v=3", // 头像地址
	name: "onlyfork依托小肥物", // 昵称
	bioFile: "/rubbish.txt", //随机废话
	links: [
		{
			name: "bilibili", // 社交平台名称
			icon: "fa6-brands:bilibili", // 图标标识
			url: "https://b23.tv/slUca1M", // 跳转链接
		},
		{
			name: "GitHub", // 社交平台名称
			icon: "fa6-brands:github", // 图标标识
			url: "https://github.com/onlyfork-qwq", // 跳转链接
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true, // 是否显示版权许可信息
	name: "CC BY-NC-SA 4.0", // 版权协议名称
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/", // 版权协议链接
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	theme: "github-dark", // 代码高亮主题（建议深色主题）
};

export const announcementConfig: AnnouncementConfig = {
	enable: true, // 是否启用公告浮窗
	text: "<a href='/updatelog/'>更新了啥?</a>(仅展示最新功能更新)\n<a href='/opa/'>他人的建议</a>\n更新文章 <a href='/posts/zhi-link/zhi-link/'>文件直连下载</a>", // 公告内容（支持 HTML）
};

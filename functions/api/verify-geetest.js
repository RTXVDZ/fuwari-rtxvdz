/**
 * Cloudflare Pages Function:
 * 极验(GeeTest v4)后端二次校验——把"是否验证通过"的裁决权从浏览器挪到这里。
 *
 * 路由: POST /api/verify-geetest
 * 前端 scuccess 后把 getValidate() 的 4 个参数 POST 过来,
 * 这里用私钥 GEETEST_CAPTCHA_KEY 生成 sign_token 调极验官方 /validate 复核,
 * 通过才返回 { ok: true },前端据此再加载评论。
 *
 * 为什么必须走这一步:前端 getValidate() 返回的 lot_number/captcha_output/
 * pass_token/gen_time 是在浏览器内存里生成的,任何人可伪造。只有后端拿私钥
 * 调极验服务器复核得出的 result 才可信。私钥绝不能下发到浏览器。
 *
 * 环境变量(在 Cloudflare Pages 面板配置):
 *   GEETEST_CAPTCHA_KEY   极验私钥(secret) —— 生产必填,绝不进前端
 *   PUBLIC_GEETEST_CAPTCHA_ID   极验 id(与仓库 .env 同名即可)
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  const CAPTCHA_KEY = env.GEETEST_CAPTCHA_KEY || "";
  const CAPTCHA_ID =
    env.PUBLIC_GEETEST_CAPTCHA_ID || env.GEETEST_CAPTCHA_ID || "";

  if (!CAPTCHA_KEY || !CAPTCHA_ID) {
    return json(
      { ok: false, error: "服务端未配置极验密钥(GEETEST_CAPTCHA_KEY)" },
      500,
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "请求体不是合法 JSON" }, 400);
  }

  const { lot_number, captcha_output, pass_token, gen_time } = body || {};
  if (!lot_number || !captcha_output || !pass_token || !gen_time) {
    return json({ ok: false, error: "缺少极验验证参数" }, 400);
  }

  try {
    // 极验要求 sign_token = HMAC-SHA256(lot_number, captcha_key) 小写 hex
    const sign_token = await hmacSha256Hex(lot_number, CAPTCHA_KEY);

    const url = `https://gcaptcha4.geetest.com/validate?captcha_id=${encodeURIComponent(
      CAPTCHA_ID,
    )}`;
    // 官方要求 Content-Type 为 form-urlencoded,但 body 是 JSON 字符串
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: JSON.stringify({
        lot_number,
        captcha_output,
        pass_token,
        gen_time,
        sign_token,
      }),
    });
    const data = await resp.json();

    if (data && data.result === "success") {
      // 复核通过,授权前端加载评论
      return json({ ok: true });
    }
    return json(
      { ok: false, error: data && data.reason ? data.reason : "极验复核未通过" },
      200,
    );
  } catch (e) {
    // 极验服务异常时放行,避免正常用户被误伤(门禁降级)
    console.error("verify-geetest upstream error:", e);
    return json({ ok: false, error: "验证服务暂不可用,请稍后重试" }, 502);
  }
}

/**
 * Cloudflare Pages Functions 环境无 node:crypto,用标准 Web Crypto 算 HMAC-SHA256。
 */
async function hmacSha256Hex(message, key) {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return [...new Uint8Array(sig
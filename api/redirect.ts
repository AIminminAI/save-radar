export default function handler(req: any, res: any) {
  const isWeChat = (req.headers['user-agent'] || '').toLowerCase().includes('micromessenger')
  const targetUrl = 'https://save-radar-opal.vercel.app'

  if (isWeChat) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(200).send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>省钱雷达 - 在浏览器中打开</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#1A1A2E;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}
.c{text-align:center;padding:40px 24px;max-width:360px}
.logo{width:72px;height:72px;border-radius:18px;background:linear-gradient(135deg,#FF6B35,#FFD700);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:36px}
h1{color:#fff;font-size:22px;font-weight:900;margin-bottom:8px}
.desc{color:rgba(255,255,255,0.5);font-size:13px;margin-bottom:24px}
.guide{background:rgba(255,255,255,0.06);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.08);text-align:left;margin-bottom:16px}
.guide h3{color:#FF6B35;font-size:14px;margin-bottom:12px}
.step{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}
.sn{width:22px;height:22px;border-radius:50%;background:rgba(0,214,143,0.2);color:#00D68F;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.st{color:rgba(255,255,255,0.7);font-size:12px;line-height:1.5}
.copy{margin-top:16px;background:rgba(0,214,143,0.08);border-radius:12px;padding:12px;text-align:center}
.copy p{color:rgba(255,255,255,0.5);font-size:11px;margin-bottom:8px}
.url{color:#00D68F;font-size:13px;font-weight:600;word-break:break-all;margin-bottom:8px}
.btn{display:inline-block;padding:8px 20px;background:#00D68F;color:#1A1A2E;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:none}
.arrow{position:fixed;top:8px;right:12px}
.arrow svg{width:50px;height:70px}
.arrow p{color:#fff;font-size:11px;font-weight:700;text-align:center;margin-top:2px}
</style>
</head>
<body>
<div class="arrow"><svg viewBox="0 0 50 70" fill="none"><path d="M25 0 L25 45 M12 32 L25 45 L38 32" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><p>点这里</p></div>
<div class="c">
<div class="logo">📡</div>
<h1>省钱雷达</h1>
<p class="desc">3秒看懂影响你的政策</p>
<div class="guide">
<h3>⚠️ 微信内无法直接打开</h3>
<div class="step"><div class="sn">1</div><div class="st">点击右上角 <b style="color:#FFD700">⋯</b> 按钮</div></div>
<div class="step"><div class="sn">2</div><div class="st">选择「<b style="color:#00D68F">在浏览器中打开</b>」</div></div>
<div class="step"><div class="sn">3</div><div class="st">即可正常使用省钱雷达</div></div>
</div>
<div class="copy">
<p>或者复制链接到浏览器打开：</p>
<p class="url">${targetUrl}</p>
<button class="btn" onclick="navigator.clipboard.writeText('${targetUrl}');this.textContent='✅ 已复制!'">📋 复制链接</button>
</div>
</div>
</body>
</html>`)
  } else {
    res.writeHead(302, { Location: targetUrl })
    res.end()
  }
}

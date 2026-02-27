// api/proxy.js - Pixiv 图片代理
export default async function handler(req, res) {
  // 从请求 URL 中提取图片路径（例如 /img-original/xxx.jpg）
  // Vercel 会将整个请求路径作为 req.url，但包含 /api/proxy 前缀
  // 我们需要去掉前缀，只保留图片部分
  const path = req.url.replace('/api/proxy', ''); // 如果访问 /api/proxy/img-original/...，则得到 /img-original/...

  // 如果路径为空，返回说明
  if (!path || path === '/') {
    res.status(200).send('Pixiv Proxy is running. Usage: /api/proxy/img-original/xxx.jpg');
    return;
  }

  // 目标 Pixiv 图片地址
  const targetUrl = `https://i.pximg.net${path}`;

  try {
    // 向 Pixiv 官方服务器发起请求
    const imageResponse = await fetch(targetUrl, {
      headers: {
        // 必须带上正确的 Referer 和 User-Agent
        'Referer': 'https://www.pixiv.net/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    // 如果 Pixiv 返回错误（如 404、403），直接返回相同状态
    if (!imageResponse.ok) {
      res.status(imageResponse.status).send(`Pixiv returned ${imageResponse.status}: ${imageResponse.statusText}`);
      return;
    }

    // 获取图片数据
    const imageBuffer = await imageResponse.arrayBuffer();

    // 设置正确的 Content-Type（从 Pixiv 响应头中获取，默认 jpeg）
    const contentType = imageResponse.headers.get('Content-Type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);

    // 发送图片数据
    res.send(Buffer.from(imageBuffer));

  } catch (error) {
    // 网络错误等
    res.status(500).send(`Proxy error: ${error.message}`);
  }
}

// 可选：配置以禁用 body 解析（对于图片代理非必需，但加上无害）
export const config = {
  api: {
    bodyParser: false,
  },
};

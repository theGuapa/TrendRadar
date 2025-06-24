import axios from 'axios'

export async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 10000, // 10 秒超时
      })
      return response.data
    } catch (err) {
      console.warn(`⚠️ 第 ${i + 1} 次请求失败，重试中...`)
      await new Promise((res) => setTimeout(res, delay))
    }
  }
  throw new Error(`❌ 请求 ${url} 失败，超过最大重试次数`)
}


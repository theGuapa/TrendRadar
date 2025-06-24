import puppeteer from 'puppeteer';

// 定义最终输出的结构类型
interface NewsResult {
  status: string;
  id: string;
  updatedTime: number;
  items: {
    id: string;
    url: string;
    title: string;
    extra: {
      date: string;
    };
  }[];
}

async function fetchChwangNews(): Promise<NewsResult> {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();

  const maxRetries = 3;
  let retries = 0;
  let result: NewsResult = {
    status: 'failure', // 初始设为 failure，成功后再改
    id: 'chwang', // 可根据需求调整 id
    updatedTime: Date.now(), // 先默认当前时间，实际解析后更新
    items: [],
  };

  while (retries < maxRetries) {
    try {
      await page.goto('https://www.chwang.com/news', {
        waitUntil: 'networkidle0',
        timeout: 60000,
      });

      // 尝试用正则提取页面内嵌 JSON（类似凤凰网逻辑）
      const html = await page.content();
      const regex = /var\s+allData\s*=\s*([\s\S]*?);/;
      const match = regex.exec(html);

      if (match) {
        const realData = JSON.parse(match[1]);
        // 假设 realData 里有需要的新闻列表字段，这里根据实际调整，比如 realData.newsList
        const rawNews = realData.newsList || []; 

        result = {
          status: 'success',
          id: 'chwang', 
          updatedTime: Date.now(), 
          items: rawNews.map((item: any) => ({
            id: item.url || '', 
            url: item.url || '', 
            title: item.title || '', 
            extra: {
              date: item.newsTime || '', 
            },
          })),
        };
        console.log(`从脚本提取到 ${result.items.length} 条新闻`);
      } else {
        // 回退到 DOM 解析
        await page.waitForSelector('.chw-newsDataItem', { timeout: 15000 });
        const items = await page.$$eval('.chw-newsDataItem', (nodes) => {
          const baseUrl = 'https://www.chwang.com';
          return nodes.map((node) => {
            const href = node.getAttribute('href') || '';
            const url = href.startsWith('http') 
              ? href 
              : href.startsWith('/') 
                ? `${baseUrl}${href}` 
                : `${baseUrl}/${href}`;
            return {
              id: url,
              url,
              title: node.querySelector('.chw-newsDataItem__title')?.textContent.trim() || '',
              extra: {
                date: node.querySelector('.chw-newsDataItem__date')?.textContent.trim() || '',
              },
            };
          });
        });

        result = {
          status: 'success',
          id: 'chwang', 
          updatedTime: Date.now(), 
          items,
        };
        console.log(`从 DOM 提取到 ${items.length} 条新闻`);
      }

      break;
    } catch (e) {
      console.error(`第 ${retries + 1} 次尝试失败:`, e.message);
      retries++;
      if (retries === maxRetries) {
        console.error('已达最大重试次数');
        result.status = 'failure';
        throw e;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  await browser.close();
  return result;
}

// 调用并输出结果
fetchChwangNews()
  .then(result => console.log(JSON.stringify(result, null, 2)))
  .catch(err => console.error('抓取失败:', err));

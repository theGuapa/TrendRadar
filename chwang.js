import puppeteer from 'puppeteer';

async function fetchChwangNews() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox'],
    });
    const page = await browser.newPage();

    const maxRetries = 3;
    let retries = 0;
    let newsItems = [];

    while (retries < maxRetries) {
        try {
            await page.goto('https://www.chwang.com/news', {
                waitUntil: 'networkidle0',
                timeout: 60000,
            });

            // 尝试通过正则表达式提取JSON数据（类似凤凰网的方式）
            const html = await page.content();
            const regex = /var\s+allData\s*=\s*([\s\S]*?);/;
            const match = regex.exec(html);
            
            if (match) {
                // 从页面脚本中提取数据（如果存在）
                const realData = JSON.parse(match[1]);
                const rawNews = realData.hotNews1 || [];
                
                newsItems = rawNews.map((item: any) => ({
                    id: item.url, // 使用URL作为唯一ID
                    status: 'success', // 添加状态字段
                    url: item.url,
                    title: item.title,
                    extra: {
                        date: item.newsTime || '',
                    }
                }));
                
                console.log(`从脚本中成功提取 ${newsItems.length} 条新闻`);
            } else {
                // 回退到DOM解析方式
                await page.waitForSelector('.chw-newsDataItem', { timeout: 15000 });
                
                newsItems = await page.$$eval('.chw-newsDataItem', (nodes) => {
                    const baseUrl = 'https://www.chwang.com';
                    return nodes.map((node) => {
                        const href = node.getAttribute('href') || '';
                        const url = href.startsWith('http') ? href : 
                                    href.startsWith('/') ? `${baseUrl}${href}` : 
                                    `${baseUrl}/${href}`;
                        
                        return {
                            id: url, // 使用URL作为唯一ID
                            status: 'success', // 添加状态字段
                            url,
                            title: node.querySelector('.chw-newsDataItem__title')?.textContent.trim() || '',
                            extra: {
                                date: node.querySelector('.chw-newsDataItem__date')?.textContent.trim() || '',
                            }
                        };
                    });
                });
                
                console.log(`从DOM中成功提取 ${newsItems.length} 条新闻`);
            }

            break;
        } catch (e) {
            console.error(`尝试第 ${retries + 1} 次失败:`, e.message);
            retries++;
            if (retries === maxRetries) {
                console.error('已达到最大重试次数');
                throw e;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    await browser.close();
    return newsItems;
}

// 调用函数并处理结果
fetchChwangNews()
  .then(news => console.log('最终结果:', news))
  .catch(err => console.error('抓取失败:', err));

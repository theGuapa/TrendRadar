import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// 定义新闻项结构
interface NewsItem {
  id: string;
  url: string;
  title: string;
  extra: {
    date: string;
  };
}

// 定义返回结果结构
interface NewsResult {
  status: string;
  id: string;
  updatedTime: number;
  items: NewsItem[];
}

export async function fetchChwangNews(): Promise<NewsResult> {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
    timeout: 120000 // 增加超时时间
  });
  
  const page = await browser.newPage();
  let result: NewsResult = {
    status: 'failure',
    id: 'chwang',
    updatedTime: Date.now(),
    items: []
  };

  try {
    console.log('开始访问目标网站...');
    await page.goto('https://www.chwang.com/news', {
      waitUntil: 'networkidle0',
      timeout: 120000
    });
    
    console.log('页面加载完成，尝试提取数据...');
    
    // 保存页面 HTML 用于调试
    const html = await page.content();
    fs.writeFileSync(path.join(__dirname, 'debug_page.html'), html);
    
    // 尝试通过正则表达式提取内嵌 JSON
    const regex = /var\s+allData\s*=\s*([\s\S]*?);/;
    const match = regex.exec(html);
    
    if (match) {
      console.log('成功匹配到 allData 变量');
      const realData = JSON.parse(match[1]);
      const rawNews = realData.newsList || [];
      
      if (rawNews.length > 0) {
        console.log(`从 JSON 数据中提取到 ${rawNews.length} 条新闻`);
        result = {
          status: 'success',
          id: 'chwang',
          updatedTime: Date.now(),
          items: rawNews.map((item: any) => ({
            id: item.url || '',
            url: item.url || '',
            title: item.title || '',
            extra: {
              date: item.newsTime || ''
            }
          }))
        };
      } else {
        console.log('JSON 数据中没有找到新闻条目');
      }
    } else {
      console.log('未找到 allData 变量，回退到 DOM 解析');
      
      // 等待新闻项选择器出现
      await page.waitForSelector('.chw-newsDataItem', {
        timeout: 30000
      });
      
      // 提取新闻项
      const items = await page.$$eval('.chw-newsDataItem', (nodes) => {
        const baseUrl = 'https://www.chwang.com';
        return nodes.map((node) => {
          const href = node.getAttribute('href') || '';
          const url = href.startsWith('http') 
            ? href 
            : href.startsWith('/') 
              ? `${baseUrl}${href}` 
              : `${baseUrl}/${href}`;
              
          const title = node.querySelector('.chw-newsDataItem__title')?.textContent?.trim() || '';
          const date = node.querySelector('.chw-newsDataItem__date')?.textContent?.trim() || '';
          
          return {
            id: url,
            url,
            title,
            extra: {
              date
            }
          };
        });
      });
      
      if (items.length > 0) {
        console.log(`从 DOM 中提取到 ${items.length} 条新闻`);
        result = {
          status: 'success',
          id: 'chwang',
          updatedTime: Date.now(),
          items
        };
      } else {
        console.log('DOM 中没有找到新闻条目');
        throw new Error('未找到新闻数据');
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('抓取过程中发生错误:', error.message);
    result.status = 'error';
    result.items = [];
    
    // 区分不同类型的错误
    if (error.name === 'TimeoutError') {
      result.status = 'timeout';
    }
    
    throw result; // 将错误结果传递给调用者
  } finally {
    await browser.close();
    console.log('浏览器已关闭');
  }
}

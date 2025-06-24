import puppeteer from 'puppeteer';

async function fetchChwangNews() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto('https://www.chwang.com/news', {
        waitUntil: 'networkidle0',
        timeout: 30000,
    });

    // 等待标题元素加载，使用标题选择器
    await page.waitForSelector('.chw-newsDataItem__title');

    const titles = await page.$$eval('.chw-newsDataItem__title', (titleNodes) => 
        titleNodes.map((node) => node.textContent.trim())
    );

    await browser.close();
    return titles;
}

async function main() {
    try {
        const newsTitles = await fetchChwangNews();
        console.log('\n📰 闯网新闻标题：\n');
        newsTitles.forEach((title, i) => {
            console.log(`${i + 1}. ${title}`);
        });
        console.log(`\n共 ${newsTitles.length} 条`);
    } catch (e) {
        console.error('❌ 抓取失败：', e);
    }
}

main();

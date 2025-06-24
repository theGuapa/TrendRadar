import express from 'express';
import cors from 'cors';
import { fetchChwangNews } from './chwang_v1';

const app = express();
const port = process.env.PORT || 3000;

// 启用 CORS 支持
app.use(cors());

// 健康检查接口
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: '服务正常运行' });
});

// 新闻 API 接口
app.get('/api/s', async (req, res) => {
  try {
    const id = req.query.id as string;
    const latest = req.query.latest;
    
    console.log(`收到请求: id=${id}, latest=${latest}`);
    
    if (!id) {
      return res.status(400).json({ 
        status: 'error', 
        message: '缺少必要参数: id' 
      });
    }
    
    if (id !== 'chwang') {
      return res.status(400).json({ 
        status: 'error', 
        message: '不支持的数据源: ' + id 
      });
    }
    
    // 调用新闻抓取函数
    const data = await fetchChwangNews();
    
    console.log(`成功返回 ${data.items.length} 条新闻`);
    res.json(data);
    
  } catch (error: any) {
    console.error('API 处理过程中发生错误:', error);
    
    // 返回适当的错误响应
    res.status(500).json({
      status: error.status || 'error',
      message: error.message || '服务器内部错误',
      details: error.items || []
    });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`🚀 服务器运行在: http://localhost:${port}`);
  console.log(`测试接口: http://localhost:${port}/api/s?id=chwang&latest`);
  console.log(`健康检查: http://localhost:${port}/health`);
});

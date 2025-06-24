import express from 'express'
import { fetchChwangNews } from './chwang_v1'; // 注意这里的导入方式

const app = express()
const port = process.env.PORT || 3000

app.get('/api/s', async (req, res) => {
  const id = req.query.id
  const latest = req.query.latest

  if (id === 'chwang') {
    try {
      const data = await fetchChwangNews()
      res.json(data)
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: e.message })
    }
  } else {
    res.status(400).json({ status: 'error', message: 'Invalid id' })
  }
})

app.listen(port, () => {
  console.log(`🚀 chwang API 运行中: http://localhost:${port}/api/s?id=chwang&latest`)
})


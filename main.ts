import * as Koa from 'koa'
import * as Router from 'koa-router'

import { initRouter } from './router';

const port = 3000

const app = new Koa()
initRouter(app, new Router())
app.listen(port, () => {
  console.log(`Listen at http://127.0.0.1:${port}`)
})

// console.log(`service start http://127.0.0.1:${port}`)

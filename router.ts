import * as Koa from 'koa';
import * as Router from 'koa-router';

import { controllers } from './src/common/decorator/restfull.decorator'

export { Ronglianyun } from './src/ronglianyun/ronglianyun.controller';

export function initRouter(app: Koa, router: Router) {
  controllers.forEach(item => {
    const prefix = item.constructor.prefix
    const url = `/${prefix}${item.url ? '/' + item.url : ''}`
    console.log(item.method, url, item.handler.name)
    router[item.method](url, ...item.middleware, item.handler)
  })
  app.use(router.routes())
}


import { Controller, Get } from '../common/index'

import { appConfig } from '../common/config/app.config';

@Controller('ronglianyun')
export class Ronglianyun {
  @Get()
  async fetchOne(ctx): Promise<void> {
    console.log('>>>>>>>>>>>>>>>>>>>>>')
    ctx.body = {
      code:0,
      message:"success"
    }
  }
}

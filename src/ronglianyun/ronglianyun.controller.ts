import { Controller } from '../common/decorator/index'
import { Get } from '../common/decorator/index'

@Controller('ronglianyun')
export class Ronglianyun {
  @Get()
  fetchOne(ctx): void {
    console.log('>>>>>>>>>>>>>>>>>>>>>')
    ctx.body = {
      code:0,
      message:"success"
    }
  }
}

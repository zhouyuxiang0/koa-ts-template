async function register(ctx) {
  ctx.check({
    'username': {
      notEmpty: true,
      isLength: {
        options: [{ min: 2, max: 5 }]
      },
      errorMessage: '用户名格式错误'
    }
  })
  const result = ctx.validationErrors()
  if(result.length > 0) {
    ctx.body = result[0]
  }
  // const res = await ctx.getValidationLegalResult()
  // console.log(res)
}

async function sendCode(ctx) {
  
}

module.exports = {
  'POST /member/register': register,
  'POST /member/sendCode': sendCode
}
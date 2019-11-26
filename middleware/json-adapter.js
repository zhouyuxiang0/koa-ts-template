module.exports = function() {
  return function * (next) {
    switch (this.method) {
      case 'GET':
        // console.log(this.query)
        break;
      case 'POST':
        // console.log(this.body)
        break;
      default:
        break;
    }
    if(next) {
      yield next
    }
  }
}
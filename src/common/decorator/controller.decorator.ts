export function Controller(path: string = '') {
  return function(target) {
    target.prefix = path || target.name
  }
}

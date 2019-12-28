export const controllers = []

export function Get (path = "", ...middleware) {
  return function(target, name, descriptor) {
    const item = {
      url: path,
      method: 'get',
      middleware,
      handler: target[name],
      constructor: target.constructor,
    }
    controllers.push(item)
  }
}

export function All (path = "", ...middleware) {
  return function(target, name, descriptor) {
    const item = {
      url: path,
      method: 'get',
      middleware,
      handler: target[name],
      constructor: target.constructor,
    }
    controllers.push(item)
  }
}

export function Delete (path = "", ...middleware) {
  return function(target, name, descriptor) {
    const item = {
      url: path,
      method: 'delete',
      middleware,
      handler: target[name],
      constructor: target.constructor,
    }
    controllers.push(item)
  }
}

export function Option (path = "", ...middleware) {
  return function(target, name, descriptor) {
    const item = {
      url: path,
      method: 'option',
      middleware,
      handler: target[name],
      constructor: target.constructor,
    }
    controllers.push(item)
  }
}

export function Patch (path = "", ...middleware) {
  return function(target, name, descriptor) {
    const item = {
      url: path,
      method: 'patch',
      middleware,
      handler: target[name],
      constructor: target.constructor,
    }
    controllers.push(item)
  }
}

export function Post (path = "", ...middleware) {
  return function(target, name, descriptor) {
    const item = {
      url: path,
      method: 'post',
      middleware,
      handler: target[name],
      constructor: target.constructor,
    }
    controllers.push(item)
  }
}

export function Put (path = "", ...middleware) {
  return function(target, name, descriptor) {
    const item = {
      url: path,
      method: 'put',
      middleware,
      handler: target[name],
      constructor: target.constructor,
    }
    controllers.push(item)
  }
}


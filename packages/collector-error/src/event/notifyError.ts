import { ERROR_TYPES, SEVERITY_TYPES } from '../config/error'

import cache from '../core/cache'

function getStacktrace() {
  let stack: any
  return stack
    ? (stack =
        'generated-stack:\n' +
        (stack = (stack = stack.replace(
          /(.*?)pem(.*?)\.js(.*)\n?/gm,
          ''
        )).replace(/^Error\n/g, '')))
    : void 0
}

/**
 * 自定义上报
 * @param tag 标题
 * @param conf 要上报的信息
 * @param conf.err 错误信息
 * @param conf.response 请求返回信息
 * @param conf.ext 自定义信息对象
 */
export function notifyError(tag: any, conf: any = {}) {
  if (tag) {
    if (window.console) {
      cache.log.log(tag)
    }
    const { err, response, metaData, ...ext } = conf
    const params = {
      errorType: ERROR_TYPES.CAUGHT,
      severity: (response && response.message) || SEVERITY_TYPES.WARNING,
      name: tag || (response && response.name),
      message: err || (response && response.message),
      stacktrace: getStacktrace(),
      metaData,
      ext
    }
    cache.monitor.emitError(params)
  }
}

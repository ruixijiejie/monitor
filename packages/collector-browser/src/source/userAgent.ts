import win from './win'

function each(object: any, factory: any) {
  for (let i = 0, l = object.length; i < l; i++) {
    if (factory.call(object, object[i], i) === false) {
      break
    }
  }
}

function toString(object: any) {
  return Object.prototype.toString.call(object)
}

function isObject(object: any) {
  return toString(object) === '[object Object]'
}

function isFunction(object: any) {
  return toString(object) === '[object Function]'
}

// const win = baseInfo.win
// 无版本的标记符
const NA_VERSION = '-1'

// 内嵌浏览器所带的方法
const external: any = win.external

const userAgent = win.navigator.userAgent
const appVersion = win.navigator.appVersion
const vendor = win.navigator.vendor

let detector: any = {}

const re_msie = /\b(?:msie |ie |trident\/[0-9].*rv[ :])([0-9.]+)/
const re_blackberry_10 = /\bbb10\b.+?\bversion\/([\d.]+)/
const re_blackberry_6_7 = /\bblackberry\b.+\bversion\/([\d.]+)/
const re_blackberry_4_5 = /\bblackberry\d+\/([\d.]+)/

// http://zakwu.me/2015/12/15/an-zhuo-shou-ji-uashou-ji/ 参考
// 硬件设备信息识别表达式。
// 使用数组可以按优先级排序。
const DEVICES = [
  [
    'nokia',
    function(ua: any) {
      // 不能将两个表达式合并，因为可能出现 "nokia; nokia 960"
      // 这种情况下会优先识别出 nokia/-1
      if (ua.indexOf('nokia ') !== -1) {
        return /\bnokia ([0-9]+)?/
      } else {
        return /\bnokia([a-z0-9]+)?/
      }
    }
  ],
  // 三星有 Android 和 WP 设备。
  [
    'samsung',
    function(ua: any) {
      if (ua.indexOf('samsung') !== -1) {
        return /\bsamsung(?:[ \-](?:sgh|gt|sm))?-([a-z0-9]+)/
      } else {
        return /\b(?:sgh|sch|gt|sm)-([a-z0-9]+)/
      }
    }
  ],
  [
    'wp',
    function(ua: any) {
      return (
        ua.indexOf('windows phone ') !== -1 ||
        ua.indexOf('xblwp') !== -1 ||
        ua.indexOf('zunewp') !== -1 ||
        ua.indexOf('windows ce') !== -1
      )
    }
  ],
  ['pc', 'windows'],
  ['ipad', 'ipad'],
  // ipod 规则应置于 iphone 之前。
  ['ipod', 'ipod'],
  ['iphone', /\biphone\b|\biph(\d)/],
  ['mac', 'macintosh'],
  // 小米
  ['mi', /\bmi[ \-]?([a-z0-9 ]+(?= build|\)))/],
  // 红米
  ['hongmi', /\bhm\b|redmi[ \-]?([a-z0-9]+)/],
  ['aliyun', /\baliyunos\b(?:[\-](\d+))?/],
  [
    'meizu',
    function(ua: any) {
      return ua.indexOf('meizu') >= 0
        ? /\bmeizu[\/ ]([a-z0-9]+)\b/
        : /\bm([0-9cx]{1,4})\b/
    }
  ],
  ['nexus', /\bnexus ([0-9s.]+)/],
  [
    'huawei',
    function(ua: any) {
      const re_mediapad = /\bmediapad (.+?)(?= build\/huaweimediapad\b)/
      if (ua.indexOf('huawei-huawei') !== -1) {
        return /\bhuawei\-huawei\-([a-z0-9\-]+)/
      } else if (re_mediapad.test(ua)) {
        return re_mediapad
      } else {
        return /\bhuawei[ _\-]?([a-z0-9]+)/
      }
    }
  ],
  [
    'lenovo',
    function(ua: any) {
      if (ua.indexOf('lenovo-lenovo') !== -1) {
        return /\blenovo\-lenovo[ \-]([a-z0-9]+)/
      } else {
        return /\blenovo[ \-]?([a-z0-9]+)/
      }
    }
  ],
  // 中兴
  [
    'zte',
    function(ua: any) {
      if (/\bzte\-[tu]/.test(ua)) {
        return /\bzte-[tu][ _\-]?([a-su-z0-9\+]+)/
      } else {
        return /\bzte[ _\-]?([a-su-z0-9\+]+)/
      }
    }
  ],
  // 步步高
  ['vivo', /\bvivo(?: ([a-z0-9]+))?/],
  [
    'htc',
    function(ua: any) {
      if (/\bhtc[a-z0-9 _\-]+(?= build\b)/.test(ua)) {
        return /\bhtc[ _\-]?([a-z0-9 ]+(?= build))/
      } else {
        return /\bhtc[ _\-]?([a-z0-9 ]+)/
      }
    }
  ],
  ['oppo', /\boppo[_]([a-z0-9]+)/],
  ['konka', /\bkonka[_\-]([a-z0-9]+)/],
  ['sonyericsson', /\bmt([a-z0-9]+)/],
  ['coolpad', /\bcoolpad[_ ]?([a-z0-9]+)/],
  ['lg', /\blg[\-]([a-z0-9]+)/],
  ['android', /\bandroid\b|\badr\b/],
  [
    'blackberry',
    function(ua: any) {
      if (ua.indexOf('blackberry') >= 0) {
        return /\bblackberry\s?(\d+)/
      }
      return 'bb10'
    }
  ]
]

// 操作系统信息识别表达式
const OS = [
  [
    'wp',
    function(ua: any) {
      if (ua.indexOf('windows phone ') !== -1) {
        return /\bwindows phone (?:os )?([0-9.]+)/
      } else if (ua.indexOf('xblwp') !== -1) {
        return /\bxblwp([0-9.]+)/
      } else if (ua.indexOf('zunewp') !== -1) {
        return /\bzunewp([0-9.]+)/
      }
      return 'windows phone'
    }
  ],
  ['windows', /\bwindows nt ([0-9.]+)/],
  ['macosx', /\bmac os x ([0-9._]+)/],
  [
    'iOS',
    function(ua: any) {
      if (/\bcpu(?: iphone)? os /.test(ua)) {
        return /\bcpu(?: iphone)? os ([0-9._]+)/
      } else if (ua.indexOf('iph os ') !== -1) {
        return /\biph os ([0-9_]+)/
      } else {
        return /\bios\b/
      }
    }
  ],
  ['yunos', /\baliyunos ([0-9.]+)/],
  [
    'Android',
    function(ua: any) {
      if (ua.indexOf('android') >= 0) {
        return /\bandroid[ \/-]?([0-9.x]+)?/
      } else if (ua.indexOf('adr') >= 0) {
        if (ua.indexOf('mqqbrowser') >= 0) {
          return /\badr[ ]\(linux; u; ([0-9.]+)?/
        } else {
          return /\badr(?:[ ]([0-9.]+))?/
        }
      }
      return 'android'
      // return /\b(?:android|\badr)(?:[\/\- ](?:\(linux; u; )?)?([0-9.x]+)?/;
    }
  ],
  ['chromeos', /\bcros i686 ([0-9.]+)/],
  ['linux', 'linux'],
  ['windowsce', /\bwindows ce(?: ([0-9.]+))?/],
  ['symbian', /\bsymbian(?:os)?\/([0-9.]+)/],
  [
    'blackberry',
    function(ua: any) {
      const m =
        ua.match(re_blackberry_10) ||
        ua.match(re_blackberry_6_7) ||
        ua.match(re_blackberry_4_5)
      return m ? { version: m[1] } : 'blackberry'
    }
  ]
]

// 浏览器内核
const ENGINE = [
  ['edgehtml', /edge\/([0-9.]+)/],
  ['trident', re_msie],
  [
    'blink',
    function() {
      return 'chrome' in win && 'CSS' in win && /\bapplewebkit[\/]?([0-9.+]+)/
    }
  ],
  ['webkit', /\bapplewebkit[\/]?([0-9.+]+)/],
  [
    'gecko',
    function(ua: any) {
      let match
      if ((match = ua.match(/\brv:([\d\w.]+).*\bgecko\/(\d+)/))) {
        return {
          version: match[1] + '.' + match[2]
        }
      }
      return
    }
  ],
  ['presto', /\bpresto\/([0-9.]+)/],
  ['androidwebkit', /\bandroidwebkit\/([0-9.]+)/],
  ['coolpadwebkit', /\bcoolpadwebkit\/([0-9.]+)/],
  ['u2', /\bu2\/([0-9.]+)/],
  ['u3', /\bu3\/([0-9.]+)/]
]
const BROWSER = [
  // Microsoft Edge Browser, Default browser in Windows 10.
  ['edge', /edge\/([0-9.]+)/],
  // Sogou.
  [
    'sogou',
    function(ua: any) {
      if (ua.indexOf('sogoumobilebrowser') >= 0) {
        return /sogoumobilebrowser\/([0-9.]+)/
      } else if (ua.indexOf('sogoumse') >= 0) {
        return true
      }
      return / se ([0-9.x]+)/
    }
  ],
  // TheWorld (世界之窗)
  // 由于裙带关系，TheWorld API 与 360 高度重合。
  // 只能通过 UA 和程序安装路径中的应用程序名来区分。
  // TheWorld 的 UA 比 360 更靠谱，所有将 TheWorld 的规则放置到 360 之前。
  [
    'theworld',
    function() {
      const x = checkTW360External('theworld')
      if (typeof x !== 'undefined') {
        return x
      }
      return 'theworld'
    }
  ],
  // 360SE, 360EE.
  [
    '360',
    function(ua: any) {
      const x = checkTW360External('360se')
      if (typeof x !== 'undefined') {
        return x
      }
      if (ua.indexOf('360 aphone browser') !== -1) {
        return /\b360 aphone browser \(([^\)]+)\)/
      }
      return /\b360(?:se|ee|chrome|browser)\b/
    }
  ],
  // Maxthon
  [
    'maxthon',
    function() {
      try {
        if (external && (external.mxVersion || external.max_version)) {
          return {
            version: external.mxVersion || external.max_version
          }
        }
      } catch (ex) {
        /* */
      }
      return /\b(?:maxthon|mxbrowser)(?:[ \/]([0-9.]+))?/
    }
  ],
  ['micromessenger', /\bmicromessenger\/([\d.]+)/],
  ['qq', /\bm?qqbrowser\/([0-9.]+)/],
  ['green', 'greenbrowser'],
  ['tt', /\btencenttraveler ([0-9.]+)/],
  [
    'liebao',
    function(ua: any) {
      if (ua.indexOf('liebaofast') >= 0) {
        return /\bliebaofast\/([0-9.]+)/
      }
      if (ua.indexOf('lbbrowser') === -1) {
        return false
      }
      let version
      try {
        if (external && external.LiebaoGetVersion) {
          version = external.LiebaoGetVersion()
        }
      } catch (ex) {
        /* */
      }
      return {
        version: version || NA_VERSION
      }
    }
  ],
  ['tao', /\btaobrowser\/([0-9.]+)/],
  ['coolnovo', /\bcoolnovo\/([0-9.]+)/],
  ['saayaa', 'saayaa'],
  // 有基于 Chromniun 的急速模式和基于 IE 的兼容模式。必须在 IE 的规则之前。
  ['baidu', /\b(?:ba?idubrowser|baiduhd)[ \/]([0-9.x]+)/],
  // 后面会做修复版本号，这里只要能识别是 IE 即可。
  ['ie', re_msie],
  ['mi', /\bmiuibrowser\/([0-9.]+)/],
  // Opera 15 之后开始使用 Chromniun 内核，需要放在 Chrome 的规则之前。
  [
    'opera',
    function(ua: any) {
      const re_opera_old = /\bopera.+version\/([0-9.ab]+)/
      const re_opera_new = /\bopr\/([0-9.]+)/
      return re_opera_old.test(ua) ? re_opera_old : re_opera_new
    }
  ],
  ['oupeng', /\boupeng\/([0-9.]+)/],
  ['yandex', /yabrowser\/([0-9.]+)/],
  // 支付宝手机客户端
  [
    'ali-ap',
    function(ua: any) {
      if (ua.indexOf('aliapp') > 0) {
        return /\baliapp\(ap\/([0-9.]+)\)/
      } else {
        return /\balipayclient\/([0-9.]+)\b/
      }
    }
  ],
  // 支付宝平板客户端
  ['ali-ap-pd', /\baliapp\(ap-pd\/([0-9.]+)\)/],
  // 支付宝商户客户端
  ['ali-am', /\baliapp\(am\/([0-9.]+)\)/],
  // 淘宝手机客户端
  ['ali-tb', /\baliapp\(tb\/([0-9.]+)\)/],
  // 淘宝平板客户端
  ['ali-tb-pd', /\baliapp\(tb-pd\/([0-9.]+)\)/],
  // 天猫手机客户端
  ['ali-tm', /\baliapp\(tm\/([0-9.]+)\)/],
  // 天猫平板客户端
  ['ali-tm-pd', /\baliapp\(tm-pd\/([0-9.]+)\)/],
  // UC 浏览器，可能会被识别为 Android 浏览器，规则需要前置。
  // UC 桌面版浏览器携带 Chrome 信息，需要放在 Chrome 之前。
  [
    'uc',
    function(ua: any) {
      if (ua.indexOf('ucbrowser/') >= 0) {
        return /\bucbrowser\/([0-9.]+)/
      } else if (ua.indexOf('ubrowser/') >= 0) {
        return /\bubrowser\/([0-9.]+)/
      } else if (/\buc\/[0-9]/.test(ua)) {
        return /\buc\/([0-9.]+)/
      } else if (ua.indexOf('ucweb') >= 0) {
        // `ucweb/2.0` is compony info.
        // `UCWEB8.7.2.214/145/800` is browser info.
        return /\bucweb([0-9.]+)?/
      } else {
        return /\b(?:ucbrowser|uc)\b/
      }
    }
  ],
  ['chrome', / (?:chrome|crios|crmo)\/([0-9.]+)/],
  // Android 默认浏览器。该规则需要在 safari 之前。
  [
    'android',
    function(ua: any) {
      if (ua.indexOf('android') === -1) {
        return
      }
      return /\bversion\/([0-9.]+(?: beta)?)/
    }
  ],
  [
    'blackberry',
    function(ua: any) {
      const m =
        ua.match(re_blackberry_10) ||
        ua.match(re_blackberry_6_7) ||
        ua.match(re_blackberry_4_5)
      return m ? { version: m[1] } : 'blackberry'
    }
  ],
  [
    'safari',
    /\bversion\/([0-9.]+(?: beta)?)(?: mobile(?:\/[a-z0-9]+)?)? safari\//
  ],
  // 如果不能被识别为 Safari，则猜测是 WebView。
  ['webview', /\bcpu(?: iphone)? os (?:[0-9._]+).+\bapplewebkit\b/],
  ['firefox', /\bfirefox\/([0-9.ab]+)/],
  ['nokia', /\bnokiabrowser\/([0-9.]+)/]
]

// 针对同源的 TheWorld 和 360 的 external 对象进行检测。
// @param {String} key, 关键字，用于检测浏览器的安装路径中出现的关键字。
// @return {Undefined,Boolean,Object} 返回 undefined 或 false 表示检测未命中。
function checkTW360External(key: string) {
  if (!external) {
    return
  } // return undefined.
  try {
    //        360安装路径：
    //        C:%5CPROGRA~1%5C360%5C360se3%5C360SE.exe
    const runpath = external.twGetRunPath.toLowerCase()
    // 360SE 3.x ~ 5.x support.
    // 暴露的 external.twGetVersion 和 external.twGetSecurityID 均为 undefined。
    // 因此只能用 try/catch 而无法使用特性判断。
    const security = external.twGetSecurityID(win)
    const version = external.twGetVersion(security)

    if (runpath && runpath.indexOf(key) === -1) {
      return false
    }
    if (version) {
      return { version }
    }
  } catch (ex) {
    /* */
  }
  return
}

// 解析使用 Trident 内核的浏览器的 `浏览器模式` 和 `文档模式` 信息。
// @param {String} ua, userAgent string.
// @return {Object}
function IEMode(ua: any) {
  if (!re_msie.test(ua)) {
    return null
  }

  let m: any, engineMode, engineVersion, browserMode, browserVersion

  // IE8 及其以上提供有 Trident 信息，
  // 默认的兼容模式，UA 中 Trident 版本不发生变化。
  if (ua.indexOf('trident/') !== -1) {
    m = /\btrident\/([0-9.]+)/.exec(ua)
    if (m && m.length >= 2) {
      // 真实引擎版本。
      engineVersion = m[1]
      const v_version: any = m[1].split('.')
      v_version[0] = parseInt(v_version[0], 10) + 4
      browserVersion = v_version.join('.')
    }
  }

  m = re_msie.exec(ua)
  browserMode = m[1]
  const v_mode = m[1].split('.')
  if (typeof browserVersion === 'undefined') {
    browserVersion = browserMode
  }
  v_mode[0] = parseInt(v_mode[0], 10) - 4
  engineMode = v_mode.join('.')
  if (typeof engineVersion === 'undefined') {
    engineVersion = engineMode
  }

  return {
    browserVersion,
    browserMode,
    engineVersion,
    engineMode,
    compatible: engineVersion !== engineMode
  }
}

// UserAgent Detector.
// @param {String} ua, userAgent.
// @param {Object} expression
// @return {Object}
//    返回 null 表示当前表达式未匹配成功。
function detect(name: string, expression: any, ua: any) {
  const expr = isFunction(expression) ? expression.call(null, ua) : expression
  if (!expr) {
    return null
  }
  const info = {
    name,
    version: NA_VERSION,
    codename: ''
  }
  const t = toString(expr)

  if (expr === true) {
    return info
  } else if (t === '[object String]') {
    if (ua.indexOf(expr) !== -1) {
      return info
    }
  } else if (isObject(expr)) {
    // Object
    if (expr.hasOwnProperty('version')) {
      info.version = expr.version
    }
    return info
  } else if (expr.exec) {
    // RegExp
    const m = expr.exec(ua)
    if (m) {
      info.version =
        m.length >= 2 && m[1] ? m[1].replace(/_/g, '.') : NA_VERSION
      return info
    }
  }
  return
}

const na = { name: '', version: '' }
// 初始化识别。
function init(ua: any, patterns: any, factory: any, detector: any) {
  let detected = na
  each(patterns, function(pattern: any) {
    const d = detect(pattern[0], pattern[1], ua)
    if (d) {
      detected = d
      return false
    }
    return
  })
  factory.call(detector, detected.name, detected.version)
}
// 解析 UserAgent 字符串
// @param {String} ua, userAgent string.
// @return {Object}
const parse = function(ua: any) {
  ua = (ua || '').toLowerCase()
  const d: any = {}
  init(
    ua,
    DEVICES,
    function(name: string, version: string) {
      const v = parseFloat(version)
      d.device = {
        name,
        version: v,
        fullVersion: version
      }
      d.device[name] = v
    },
    d
  )

  init(
    ua,
    OS,
    function(name: string, version: string) {
      const v = parseFloat(version)
      d.os = {
        name,
        version: v,
        fullVersion: version
      }
      d.os[name] = v
    },
    d
  )

  const ieCore = IEMode(ua)

  init(
    ua,
    ENGINE,
    function(name: string, version: string) {
      let mode = version
      // IE 内核的浏览器，修复版本号及兼容模式。
      if (ieCore) {
        version = ieCore.engineVersion || ieCore.engineMode
        mode = ieCore.engineMode
      }
      const v = parseFloat(version)
      d.engine = {
        name,
        version: v,
        fullVersion: version,
        mode: parseFloat(mode),
        fullMode: mode,
        compatible: ieCore ? ieCore.compatible : false
      }
      d.engine[name] = v
    },
    d
  )

  init(
    ua,
    BROWSER,
    function(name: string, version: string) {
      let mode = version
      // IE 内核的浏览器，修复浏览器版本及兼容模式。
      if (ieCore) {
        // 仅修改 IE 浏览器的版本，其他 IE 内核的版本不修改。
        if (name === 'ie') {
          version = ieCore.browserVersion
        }
        mode = ieCore.browserMode
      }
      const v = parseFloat(version)
      d.browser = {
        name,
        version: v,
        fullVersion: version,
        mode: parseFloat(mode),
        fullMode: mode,
        compatible: ieCore ? ieCore.compatible : false
      }
      d.browser[name] = v
    },
    d
  )
  return d
}

detector = parse(userAgent + ' ' + appVersion + ' ' + vendor)
export default detector

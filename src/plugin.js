const path = require('path');
const glob = require('glob');
const globBase = require('glob-base');

let directorys = [];

// 格式化路径
const formatFilePath = (_path) => {
  const sep = path.sep;
  if (_path.includes(sep)) return _path.split(sep).filter(Boolean).join('/');

  return _path
};

module.exports = class WebpackDynamicEntryPlugin {
  constructor() {
  }

  /**
   *
   * @param pattern glob参数
   * @param options glob选项
   */
  static getEntry({pattern, options = {}, generate} = {}) {
    if (typeof pattern === 'string') pattern = [pattern]

    return () => {
      let entry = {}
      pattern.forEach(globStr => {
        const baseDir = globBase(globStr).base
        if (!directorys.includes(baseDir)) directorys.push(baseDir)

        glob.sync(globStr, options).forEach(file => {
          // 格式化 entryName
          const entryName = formatFilePath(path.relative(baseDir, file).replace(path.extname(file), ''));
          entry[entryName] = file
        })
      })
      if (generate && typeof generate === 'function') return generate(entry)
      return entry
    };
  }

  /**
   * webpack插件调用
   * @param compiler
   */
  apply(compiler) {
    const {afterCompile, constructor} = this
    if (compiler.hooks) {
      // Support Webpack >= 4
      compiler.hooks.afterCompile.tapAsync(constructor.name, afterCompile.bind(this));
    } else {
      // Support Webpack < 4
      compiler.plugin("after-compile", afterCompile);
    }
  }

  afterCompile(compilation, callback) {
    const contextDependencies = compilation.contextDependencies
    if (Array.isArray(contextDependencies)) {
      // Support Webpack < 4
      compilation.contextDependencies = contextDependencies.concat(directorys);
    } else {
      // Support Webpack >= 4
      for (const dir of directorys) {
        compilation.contextDependencies.add(dir);
      }
    }
    callback && callback();
  }
}

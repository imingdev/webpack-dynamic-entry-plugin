const path = require('path');
const glob = require('glob');
const globBase = require('glob-base');

let globBaseDirectory;

module.exports = class WebpackDynamicEntryPlugin {
  constructor() {
  }

  /**
   *
   * @param pattern glob参数
   * @param options glob选项
   */
  static getEntry(pattern, options = {}, entryHandle) {
    globBaseDirectory = globBase(pattern).base

    return () => {
      let entry = {}

      glob.sync(pattern, options).forEach(file => {
        // 格式化 entryName
        const entryName = path
          .relative(globBaseDirectory, file)
          .replace(path.extname(file), '')
          .split(path.sep)
          .filter(Boolean)
          .join('/');

        if (entryHandle) {
          const {name, path} = entryHandle(entryName, file)
          entry[name] = path
        } else {
          entry[entryName] = file
        }

      })
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
      compilation.contextDependencies = contextDependencies.concat([globBaseDirectory]);
    } else {
      // Support Webpack >= 4
      compilation.contextDependencies.add(globBaseDirectory);
    }
    callback && callback();
  }
}

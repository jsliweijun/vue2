import babel from 'rollup-plugin-babel';

export default {
    input: './src/index.js',
    output: {
        format: 'umd', // 支持 amd ，commonjs 规范， 提供这个对象 window.Vue
        name: 'Vue',
        file: 'dist/vue.js',
        sourcemap: true // es5 能找到 es6 源码
    },
    plugins: [
        // 使用插件，处理es6语法，使用 babel 进行转化，排除 node_modules 文件
        babel({
            //排除， glob 语法，** 表示任意文件任意目录
            exclude: 'node_modules/**'
        })
    ]
};

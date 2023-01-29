const path = require('path');

module.exports = {
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ],
    },

    resolve: {
        extensions: ['.ts', '.js'],
    },

    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'autumn-contour-gl.js',
        globalObject: 'this',
        library: {
            name: 'autumncontourgl',
            type: 'umd',
        }
    },

    externals: {
        luxon: {
            commonjs: 'luxon',
            commonjs2: 'luxon',
            amd: 'luxon',
            root: 'luxon',
        },
    },
};
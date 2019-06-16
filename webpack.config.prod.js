const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const fs = require('fs');
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, './build'),
        filename: '[name].[hash].js',
        publicPath: '.',
    },
    optimization: {
        minimizer: [
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, 'index.html'),
            }),
            // new UglifyJsPlugin({
            //     cache: true,
            //     parallel: true,
            //     sourceMap: false, // set to true if you want JS source maps
            // }),
            // new OptimizeCSSAssetsPlugin({}),
            // new MiniCssExtractPlugin({
            //     filename: '[name].[hash].css',
            // }),
        ],
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                use: 'babel-loader',
            },
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                    },
                },
            },
            {
                test: /\.(png|jpg|gif|ico|svg|pvr|pkm|static|ogg|mp3|wav)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[ext]',
                    }
                }
            },
            // {
            //     test: /\.css$/,
            //     include: /node_modules/,
            //     use: [
            //         'style-loader',
            //         MiniCssExtractPlugin.loader,
            //         {
            //             loader: 'css-loader',
            //             options: {
            //                 importLoaders: 1,
            //             },
            //         },
            //     ],
            // },
            // {
            //     test: /\.less$/,
            //     include: /node_modules/,
            //     use: [
            //         'style-loader',
            //         MiniCssExtractPlugin.loader,
            //         {
            //             loader: 'css-loader',
            //             options: {
            //                 importLoaders: 1,
            //             },
            //         },
            //         {
            //             loader: 'less-loader',
            //             options: JSON.parse(fs.readFileSync('.lessrc')),
            //         },
            //     ],
            // },
            // {
            //     test: /\.(less|css)$/,
            //     exclude: /node_modules/,
            //     use: [
            //         'style-loader',
            //         // MiniCssExtractPlugin.loader,
            //         {
            //             loader: 'css-loader',
            //             options: {
            //                 importLoaders: 1,
            //                 module: 1,
            //             },
            //         },
            //         {
            //             loader: 'less-loader',
            //             options: {
            //                 noIeCompat: true,
            //             },
            //         },
            //     ],
            // },
            // {
            //     test: /\.(png|jpg|gif|jpeg)$/,
            //     use: [
            //         {
            //             loader: 'url-loader',
            //         },
            //     ],
            // },
        ],
    },

    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'/*, '.less', '.css', '.jpg', '.png'*/],
    },
};

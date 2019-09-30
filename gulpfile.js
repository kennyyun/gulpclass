var gulp = require('gulp'); //引入gulp工具
const $ = require('gulp-load-plugins')(); //針對gulp開頭套件，全部載入專案使用，不需要再一一定義require進專案，後續使用到的plugin都需要用"$."載入。
// var jade = require('gulp-jade'); //引用gulp-jade工具，html快速編輯套件
// var sass = require('gulp-sass'); //引用gulp-sass工具
// var plumber = require('gulp-plumber'); //引用gulp-plumber，遇程式執行錯誤繼續執行，不要終止
// var postcss = require('gulp-postcss'); //優化CSS檔案套件
var autoprefixer = require('autoprefixer'); //為CSS檔自動產生前綴詞，以兼容大部份版本的瀏覽器。
// const sourcemaps = require('gulp-sourcemaps');
// const babel = require('gulp-babel');
// const concat = require('gulp-concat');
var mainBowerFiles = require('main-bower-files'); //將gulp與bower串接的工具
// var order = require("gulp-order");// 外部載入的套件如果需要排序gulp-order排定先後順序 
var browserSync = require('browser-sync').create(); //建立一個虛擬伺服器，來預覽完成檔案。
var minimist = require('minimist') // 依據'--env 環境變數'，所傳入的參數'develop'=不壓縮;'production'=最大化壓縮，來決定輸出的檔案為開發版或壓縮版程式。
// var clean = require('gulp-clean'); //清空指定資料夾及檔案
// var imagemin = require('gulp-imagemin'); //圖片檔壓縮功能之宣告
var data = require('gulp-data');

var envOptions = {   //宣告一個環境變數，初始值為'env'字串
    string: 'env',
    default: {env: 'develop'}
}
var options = minimist(process.argv.slice(2), envOptions)
console.log(options)

gulp.task('clean', function () {  ////清空指定資料夾及檔案
    return gulp.src(['./.tmp', './public'], {read: false, allowEmpty:true}) //allowEmpty，允許當指定資料夾為空資料夾時，略過不處理。
        .pipe($.clean());
});

// gulp.task('copyHTML', function () { //新增一個gulp的任務task，名稱為「copyHTML」
//     return gulp.src('./source/**/*.html') //gulp.src代入資料的來源路徑檔，包含全部的*.html檔案
//         .pipe(gulp.dest('./public/')) //gulp.dest('輸出目標資料夾')
// });

gulp.task('jade', function() {  //從https://www.npmjs.com/package/gulp-jade復製，並新增done回傳函數，避免程式回傳Did you forget to signal async completion?錯誤。
    // var YOUR_LOCALS = {};

    return gulp.src('./source/**/*.jade')  // 與('./source/*.jade')比，加入/**會針對所有子資料夾做編譯
        .pipe($.plumber()) //程式編輯階段遇錯不會停止，繼續執行
        // .pipe($.data(function() {  //使用gulp-data撈取外部json資料
        //     var khdata = require('./source/data/data.json');
        //     var menu = require('./source/data/menu.json');
        //     var source = {
        //         'khdata': khdata,
        //         'menu': menu
        //     };
        //     return source;
        // }))
        .pipe($.jade({  //使用"$.jade"是因為載入gulp-load-plugins套件後，使用gulp為開頭的plugin的套件，必須增加"$."方可調用。
            pretty: true //編譯完html檔案，不要壓縮
        }))
        .pipe(gulp.dest('./public/'))
        .pipe(browserSync.stream()); //使用browserSync伺服器預覽檔案，並自動重新整理。
        // done(); //傳入一個done的函數，结束task    
});

gulp.task('sass', function () {
    return gulp.src('./source/stylesheets/**/*.scss')
        .pipe($.plumber()) //程式編輯階段遇錯不會停止，繼續執行
        .pipe($.sourcemaps.init()) //使用sourcemaps功能，顯示檔案合併前指令原始位置。
        .pipe($.sass().on('error', $.sass.logError))
        // 執行完上述程式已完成編譯CSS code
        .pipe($.postcss([autoprefixer()])) // 直接引入 autoprefixer
        .pipe($.if(options.env === 'production',$.minifyCss())) //透過gulp-minify-css套件，將CSS檔做最小化的處理
        .pipe($.sourcemaps.write('.')) //將檔案合併前指令位置顯示。
        .pipe(gulp.dest('./public/css'))
        .pipe(browserSync.stream()); //使用browserSync伺服器預覽檔案，並自動重新整理。
});

gulp.task('imageMin', () => //進行圖片檔最佳化壓縮
    gulp.src('./source/images/*.{png,jpg,gif,ico}')
        .pipe($.if(options.env === 'production', $.imagemin(
            [
                $.imagemin.gifsicle({interlaced: true}), //型別：Boolean 預設：false 隔行掃描gif進行渲染
                $.imagemin.jpegtran({progressive: true}), //型別：Boolean 預設：false 無失真壓縮jpg圖片
                $.imagemin.optipng({optimizationLevel: 5}), //型別：Number  預設：3  取值範圍：0-7（優化等級）
                $.imagemin.svgo({
                    plugins: [
                        {removeViewBox: true},
                        {cleanupIDs: false}
                    ]
                })
            ]
        )))
        .pipe(gulp.dest('./public/images'))
);

gulp.task('babel', () =>  //gulp-babel編輯程式片段
    gulp.src('./source/js/**/*.js')
        .pipe($.sourcemaps.init()) //使用sourcemaps功能，顯示檔案合併前指令原始位置。
        .pipe($.babel({
            presets: ['@babel/env']
        }))
        .pipe($.concat('all.js')) //透過gulp-concat套件，將所有的.js檔案合併到all.js檔
        .pipe($.if(options.env === 'production',$.uglify())) //透過gulp-uglify工具，將javascript程式做最佳化及壓縮處理。
            //compress:{drop_console: true}  //放棄檔案中所有的console log測試行為，可以減少一一移除console測試的困擾。
        
        .pipe($.sourcemaps.write('.')) //將檔案合併前指令位置顯示。
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.stream()) //使用browserSync伺服器預覽檔案，並自動重新整理。
);

gulp.task('bower', function() {
    return gulp.src(mainBowerFiles({
        "overrides": {                     //自行定義bower管理套件名稱
            "vue": {                       // 套件名稱為/vendors資料夾裡的'vue'
                "main": "dist/vue.js"      // 欲取用套件的檔案資料夾路徑
            }
        }
    }))
        .pipe(gulp.dest('./.tmp/vendors'))
});

gulp.task('vendorJs', function(){ //將外部載入的JS檔案，全部匯入專案資料夾public內, 並且優先執行[bower]後，再執行[vendorJs]任務。
    return gulp.src('./.tmp/vendors/**/**.js') //檔案來源為bower管裡的js檔案位置，'./.tmp/vendors/'，裡的所有js檔案。
    .pipe($.order([                //使用gulp-order將外部載入的套件做排序處理。
        'jquery.js',
        'bootstrap.js',
        'vue.js'
    ]))
    .pipe($.concat('vendors.js')) //將所有的js檔，使用concat合併至同一個'vendors.js檔案內。
    .pipe($.if(options.env === 'production',$.uglify()))  //透過gulp-uglify工具，將javascript程式做最佳化及壓縮處理。
    .pipe(gulp.dest('./public/js')) //將合併後的檔案，輸出至'./public/js'，的資料夾內。
})

// Static server
// gulp.task('browser-sync', function() {  //建立一個虛擬伺服器來預覽檔案。
//     browserSync.init({
//         server: {
//             baseDir: "./public/"
//         },
//         reloadDebounce: 2000
//     });
//     gulp.watch('./source/scss/**/*.scss', gulp.series('sass')); // gulp 4.x 版本必須使用 gulp.series() 呼叫sass任務名稱。
//     gulp.watch('./source/**/*.jade', gulp.series('jade'));
//     gulp.watch('./source/js/**/*.js', gulp.series('babel'));
// });



gulp.task('watch', function () { //監控資料檔案異動存檔後，自動更新異動內容
    gulp.watch('./source/scss/**/*.scss', gulp.series('sass')); // gulp 4.x 版本必須使用 gulp.series() 呼叫sass任務名稱。
    gulp.watch('./source/**/*.jade', gulp.series('jade'));
    gulp.watch('./source/js/**/*.js', gulp.series('babel'));
});

gulp.task('deploy', function() {
    return gulp.src('./public/**/*')
    .pipe($.ghPages());
});

gulp.task('build', gulp.series('clean',gulp.parallel('jade', 'sass', 'babel', gulp.series('bower', 'vendorJs','imageMin'))));

gulp.task('default',
    gulp.series('clean','bower', 'vendorJs',
    gulp.parallel('jade', 'sass', 'babel','imageMin'),
    function(done) {
        browserSync.init({
            server: {
                baseDir: "./public/"
            },
            reloadDebounce: 2000
        })

        gulp.watch('./source/scss/**/*.scss', gulp.series('sass')); // gulp 4.x 版本必須使用 gulp.series() 呼叫sass任務名稱。
        gulp.watch('./source/**/*.jade', gulp.series('jade'));
        gulp.watch('./source/js/**/*.js', gulp.series('babel'));
    done();
    }
    )
);

// gulp.task('default',gulp.series(['jade','sass','babel','bower','vendorJs','imageMin','watch'])); //將gulp任務打包，不用再分別執行gulp jade;gulp sass;gulp watch，執行gulp即可。
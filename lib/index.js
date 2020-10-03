// 实现这个项目的构建任务
const del = require('del')

const loadPlugins = require('gulp-load-plugins');
const plugins = loadPlugins();

const browserSync = require('browser-sync')
const bs = browserSync.create();

//parallel (parallel--平行的）并行任务
const {series, parallel, src, dest, watch} = require('gulp');
const { reload } = require('browser-sync');

//返回当前命令行的工作目录
const cwd = process.cwd();  


let config = {
    build:{
        src:'src',
        dist:'dist',
        temp:'temp',
        public:'public',
        paths:{
            styles:'assets/styles/*.scss',
            scripts:'assets/scripts/*.js',
            pages:'*.html',
            images:'assets/images/**',
            fonts:'assets/fonts/**'
        }
    }
} ;

try{
    const loadConfig = require(`${cwd}/pages.config.js`)
    config = Object.assign({},config,loadConfig);
}catch(e){

}

let {data,build:{src:buildSrc,dist,temp,public,paths:{styles,scripts,pages,images,fonts}}} = config;


const clean = () => {
    return del([dist,temp]);
}

const style = () => {
    return src(styles,{base:buildSrc,cwd:buildSrc})
    .pipe(plugins.sass({outputStyle:'expanded'}))
    .pipe(dest(temp))
}

const script = () => {
    return src(scripts,{base:buildSrc,cwd:buildSrc})
    .pipe(plugins.babel({presets:[require('@babel/preset-env')]}))
    .pipe(dest(temp));
}

const page = () => {
    return src(pages,{base:buildSrc,cwd:buildSrc})
    .pipe(plugins.swig({data}))
    .pipe(dest(temp))
}

const image = () => {
    return src(images,{base:buildSrc,cwd:buildSrc})
    .pipe(plugins.imagemin())
    .pipe(dest(dist))
}

const font = () => {
    return src(fonts,{base:buildSrc,cwd:buildSrc})
    .pipe(plugins.imagemin())
    .pipe(dest(dist))
}

const extra = ()=>{
    return src('**', {base:public,cwd:public})
    .pipe(dest(dist))
}

//读取流有不同的文件类型。

const serve = ()=>{
    watch(styles,{cwd:buildSrc},style)
    watch(scripts,{cwd:buildSrc}, script)
    watch(pages,{cwd:buildSrc}, page)

    watch([
        images,
        fonts,
    ],{cwd:buildSrc},bs.reload)

    watch('**',{cwd:public},reload)
    

    // watch('src/assets/images/**', image)
    // watch('src/assets/font/**', font)
    // watch('public/**', extra)

    bs.init({
        notify:false,
        port:2080,
        // open:false,
        // files:'dist/**',
        server:{
            baseDir:[temp,dist,public],
            routes:{
                '/node_modules':'node_modules'
            }
        }
    })
}

const useref = () => {
    return src(pages,{base:temp,cwd:temp})
          .pipe(plugins.useref({searchPath:[temp, '.']}))
          //html, js, css
          .pipe(plugins.if(/\.js$/, plugins.uglify()))
          .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
          .pipe(plugins.if(/\.html$/, plugins.htmlmin({collapseWhitespace:true, minifyCSS:true, minifyJS:true})))
          .pipe(dest(dist))
}

const compile = parallel(style,script,page);

const build = series(
    clean, 
    parallel(
        series(compile,useref),
        image, 
        font,
        extra
    ));

const develop = series(compile, serve);

module.exports = {
    clean,
    build,
    develop,
}


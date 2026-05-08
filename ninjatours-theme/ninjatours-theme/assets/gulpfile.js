let	gulp         = require('gulp'),
	rename 		 = require('gulp-rename'),
	rigger 		 = require('gulp-rigger'),
	sass         = require('gulp-sass'),
	browserSync  = require('browser-sync'),
	cleancss     = require('gulp-clean-css'),
	autoprefixer = require('gulp-autoprefixer');

gulp.task('browser-sync', function() {
	browserSync({
		server: {baseDir: 'app'},
		notify: false,
	})
});

function bsReload(done) { browserSync.reload(); done(); };

gulp.task('styles', function() {
	return gulp.src('app/scss/**/*.scss')
	.pipe(sass({ outputStyle: 'expanded' }))
	.pipe(autoprefixer({
		grid: true,
		overrideBrowserslist: ['last 10 versions']
	}))
	.pipe(gulp.dest('app/css'))
	.pipe(cleancss( {level: { 1: { specialComments: 0 } } }))
	//.pipe(rename('main.min.css'))
	//.pipe(gulp.dest('app/css'))
	//.pipe(browserSync.stream())
});

gulp.task('html', function() {
	return gulp.src('app/html-dev/*.html')
	.pipe(rigger())
	.pipe(gulp.dest('app/'))
	.pipe(browserSync.reload({ stream: true }))
});

gulp.task('scripts', function() {
	return gulp.src('app/js/**/*.js')
	.pipe(browserSync.reload({ stream: true }))
});

gulp.task('watch', function() {
	gulp.watch('app/scss/**/*.scss', gulp.parallel('styles'));
	//gulp.watch('app/js/**/*.js', gulp.parallel('scripts'));
	//gulp.watch('app/html-dev/**/*.html', gulp.parallel('html'));
});

gulp.task('default', gulp.parallel('styles', 'browser-sync', 'watch'));
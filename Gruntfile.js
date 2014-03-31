module.exports = function (grunt) {
	grunt.initConfig({
		uglify: {
			options: {
				mangle: false
			},
			build: {
				src: 'static/js/main.js',
				dest: 'static/js/main.min.js'
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.registerTask('default', ['uglify']);
};

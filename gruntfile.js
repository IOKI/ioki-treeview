module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: [
                'demo/**/*.js',
                'gruntfile.js'
            ],
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            }
        },
        compass: {
            dist: {
                options: {
                    sassDir: 'src/scss',
                    cssDir: 'demo/css'
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: 9000,
                    hostname: 'localhost',
                    open: {
                        target: 'http://localhost:9000/demo/development.html'
                    },
                    keepalive: true
                }
            }
        },
        watch: {
            html: {
                files: [
                    'demo/**/*.html'
                ],
                options: {
                    spawn: false,
                    livereload: true
                }
            },
            css: {
                files: ['src/scss/*.scss'],
                tasks: ['compass'],
                options: {
                    spawn: false,
                    livereload: true
                }
            }
        },
        concurrent: {
            server: [
                'connect:server',
                'watch'
            ]
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent');

    grunt.registerTask('test', ['jshint']);
    grunt.registerTask('serve', ['concurrent:server']);
    grunt.registerTask('build', ['jshint', 'compass']);

    grunt.registerTask('default', ['build', 'serve']);
};
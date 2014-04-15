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
        copy: {
            main: {
                files: [
                    {expand: true, src: ['demo/css/ioki-treeview.css', 'src/js/ioki-treeview.tpl.html'], dest: './', flatten: true}
                ]
            }
        },
        concat: {
            dist: {
                src: [
                    'src/js/recursionhelper.js',
                    'src/js/ioki-treeview-directive.js',
                    'src/js/ioki-treeview-filters.js'
                ],
                dest: 'ioki-treeview.js'
            }
        },
        uglify: {
            release: {
                options: {
                    report: 'min',
                    mangle: false
                },
                files: {
                    'ioki-treeview.min.js': ['ioki-treeview.js']
                }
            }
        },
        cssmin: {
            combine: {
                files: {
                    'ioki-treeview.min.css': ['ioki-treeview.css']
                }
            }
        },
        watch: {
            js: {
                files: [
                    'src/js/**/*.js',
                    'demo/**/*.js'
                ],
                tasks: ['jshint'],
                options: {
                    spawn: false,
                    livereload: true
                }
            },
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
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent');

    grunt.registerTask('test', ['jshint']);
    grunt.registerTask('release', ['test', 'copy', 'concat', 'uglify', 'cssmin']);
    grunt.registerTask('serve', ['concurrent:server']);
    grunt.registerTask('build', ['jshint', 'compass']);

    grunt.registerTask('default', ['build', 'serve']);
};
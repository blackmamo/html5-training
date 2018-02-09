const gulp = require("gulp");
const jasmine = require("gulp-jasmine");
const karma = require("bitcoin-support/js/karmaGulpUtils");
const perfTests = require("./test/benchmarks/benchmarkSuite");
const eslint = require("gulp-eslint");
const istanbul = require("gulp-istanbul");

// This dependency does the magic things needed when using the debug server option
const util = require("./spec/support/serverGulpUtils");

// If this var is set, the server will be started up such that the
const ServerImg = "matcher";
const ServerContainer = "matchServer";

gulp.task("createImage", done => {
  return util.createServerImage(ServerImg, done);
});

gulp.task("runServer", ["createImage"], () => {
  util.runServer(ServerImg, ServerContainer, {});
});

gulp.task("runTestServer", ["createImage"], () => {
  util.runServer(ServerImg, ServerContainer, {
    isTest: true,
    canClearBook: true
  });
});

gulp.task("runPerfTestServer", ["createImage"], () => {
  // running perf tests we don't want the baggage of storing the order history
  util.runServer(ServerImg, ServerContainer, {
    isTest: true,
    removeDeadOrders: true
  });
});

gulp.task("lint", () => {
  // ESLint ignores files with "node_modules" paths.
  // So, it's best to have gulp ignore the directory as well.
  // Also, Be sure to return the stream from the task;
  // Otherwise, the task may end before the stream has finished.
  return (
    gulp
      .src(["**/*.js", "!node_modules/**"])
      // eslint() attaches the lint output to the "eslint" property
      // of the file object so it can be used by other modules.
      .pipe(eslint())
      // eslint.format() outputs the lint results to the console.
      // Alternatively use eslint.formatEach() (see Docs).
      .pipe(eslint.format())
      // To have the process exit with an error code (1) on
      // lint error, return the stream and pipe to failAfterError last.
      .pipe(eslint.failAfterError())
  );
});

gulp.task("pre-test", function() {
  return (gulp
      .src(["app/**.js", "!app/server.js"])
      // Covering files
      .pipe(istanbul({ includeUntested: true }))
      // Force `require` to return covered files
      .pipe(istanbul.hookRequire()) );
});

gulp.task("unitTests", ["pre-test"], done => {
  gulp
    .src("spec/unit/*.js")
    .pipe(jasmine())
    // Creating the reports after tests ran
    .pipe(istanbul.writeReports())
    // Enforce a coverage of at least 90%
    .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }))
    .on("end", () => {
      done();
    });
});

gulp.task(
  "integrationTests",
  util.nonServerDebugDependencies(["runTestServer"]),
  done => {
    karma(
      {
        // This is how we pass the server address to the client
        client: {
          jasmine: {
            serverPort: util.boundServerPort()
          }
        }
      },
      done
    );
  }
);

gulp.task(
  "perfTests",
  util.nonServerDebugDependencies(["runTestServer"]),
  done => {
    perfTests(util.boundServerPort(), done);
  }
);

gulp.task("all", ["unitTests", "integrationTests", "perfTests", "lint"]);

const gulp = require("gulp");
const dockerUtils = require("./js/dockerGulpUtils");

// Tasks for external resources required by server

gulp.task("elkImage", done => {
  return dockerUtils.createImage(["elk/DockerFile"], "elk", done);
});

gulp.task("runElk", ["elkImage"], () => {
  dockerUtils.runImage(
    "elk",
    "-p 5601:5601 -p 9200:9200 -p 9300:9300 -p 5044:5044",
    "elkServer"
  );
});

// Tasks to start server or client in a way that enables debugging and hot code replace

const gulp = require("gulp");
const through = require("through2");
const changed = require("gulp-changed");
const cp = require("child_process");
const fs = require("fs");

function runCmd(cmd, captureOutput) {
  console.log("Executing: " + cmd);
  console.log("This could take some time");
  return cp.execSync(cmd, captureOutput ? {} : { stdio: "inherit" });
}

function createImage(inputs, imgName, totallyDone) {
  // used to determine if we need to rebuild the image, which is expensive,
  // relying on having written this file and gulp-changed is easier than
  // writing code that checks with docker, but isn't 100% accurate e.g. the img manually deleted
  let imgCreatedFile = "dist/" + imgName + ".created";

  return gulp
    .src(inputs)
    .pipe(
      changed("dist", {
        transformPath: p => {
          return imgCreatedFile;
        }
      })
    )
    .pipe(
      through.obj((file, enc, done) => {
        runCmd(
          "docker build -t " + imgName + " --file " + file.base + "DockerFile ."
        );
        fs.writeFileSync(
          imgCreatedFile,
          "Last test image created " + Date.now()
        );
        done();
      })
    )
    .pipe(
      through.obj((file, enc, done) => {
        totallyDone();
      })
    );
}

function runImage(imgName, runOptions, containerName, launchArgs) {
  try {
    runCmd("docker rm -f " + containerName);
  } catch (err) {}
  containerName = containerName ? " --name " + containerName : "";
  launchArgs = launchArgs ? " " + launchArgs : "";
  runCmd(
    "docker run -d --rm " +
      runOptions +
      containerName +
      " " +
      imgName +
      launchArgs
  );
}

module.exports = {
  runCmd: runCmd,
  createImage: createImage,
  runImage: runImage
};

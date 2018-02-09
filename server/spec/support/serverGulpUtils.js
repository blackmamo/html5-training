const dockerUtils = require("bitcoin-support/js/dockerGulpUtils");
const getArg = require("bitcoin-support/js/getArg");

// If this const is set, the server will be started up such that the
const debugServerArg = getArg("mamos-debug-server", 9000);

// When using a volume mount we don't need to recreate the image as often
const useVolumeMount =
  getArg("use-volume-mount", true) || Boolean(debugServerArg);

const fixedPort = getArg("fixed-port", true);

function createServerImage(imageName, done) {
  // deps change based on whether we volume map the js source
  let deps = ["DockerFile", "package.json", "launch.sh"];
  if (!useVolumeMount) {
    console.log("Ensuring image contains latest application code");
    deps.push("app/**/*.js");
  }
  return dockerUtils.createImage(deps, imageName, done);
}

// This is a default server port. When running tests, but not debugging, docker will allocate a dynamic
// port and this will be overridden. If we are debugging the server then, the fixed port is retained for easse of use
// The point of dynamic port binding for tests is in a CI environment we can run builds in parallel
let boundServerPort = 8888;
function dockerRunOptions(isTest) {
  let args = "--link elkServer ";
  if (debugServerArg) {
    args += "--expose=" + debugServerArg + " -p " + debugServerArg + ":9000 ";
  }
  let dynamicPort = isTest && !debugServerArg && !fixedPort;
  if (dynamicPort) {
    args += "-p 8080";
  } else {
    args += "-p " + boundServerPort + ":8080";
  }
  if (useVolumeMount) {
    args += " -v " + process.cwd() + "/app:/usr/src/app/app:rw";
  }
  return args;
}

function serverOptions(removeDeadOrders, canClearBook) {
  args = "";
  if (removeDeadOrders) {
    args += " --remove-dead-orders";
  }
  if (canClearBook) {
    args += " --can-clear-book";
  }
  if (debugServerArg) {
    args += " --debug";
  }
  if (useVolumeMount) {
    args += " --nodemon";
  }
  return args;
}

function nonServerDebugDependencies(dependencies) {
  if (debugServerArg) {
    return [];
  } else {
    return dependencies;
  }
}

function runServer(imageName, containerName, options) {
  let testServer = false,
    removeDeadOrders = false,
    canClearBook = false;
  if (options) {
    if (options.isTest) {
      testServer = true;
    }
    if (options.removeDeadOrders) {
      removeDeadOrders = true;
    }
    if (options.canClearBook) {
      canClearBook = true;
    }
  }
  console.log("Test Server: " + testServer);
  console.log("Server removing dead orders: " + removeDeadOrders);
  dockerUtils.runImage(
    imageName,
    dockerRunOptions(testServer),
    containerName,
    serverOptions(removeDeadOrders, canClearBook)
  );

  // capture the port the server has locally
  let portOutput = dockerUtils.runCmd(
    "docker port " + containerName + " 8080",
    true
  );
  boundServerPort = /\d(\.\d){3}:(\d+)/.exec(portOutput)[2];

  console.log("Server was mapped to host port: " + boundServerPort);
}

module.exports = {
  runServer: runServer,
  boundServerPort: () => {
    return boundServerPort;
  },
  createServerImage: createServerImage,
  nonServerDebugDependencies: nonServerDebugDependencies
};

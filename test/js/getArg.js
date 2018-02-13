module.exports = (argName, defaultValue) => {
  for (i = 0; i < process.argv.length; i++) {
    let arg = process.argv[i];
    let match = new RegExp("--" + argName + "(=(.*))?").exec(arg);
    if (match) {
      if (match[2]) {
        return match[2];
      } else {
        return defaultValue;
      }
    }
  }
  return undefined;
};

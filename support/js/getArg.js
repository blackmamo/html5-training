module.exports = function(argName, defaultValue){
    for (i = 0; i < process.argv.length; i++){
        var arg = process.argv[i]
        var match = new RegExp('--' + argName + '(=(.*))?').exec(arg)
        if (match){
            if (match[2]){
                return match[2]
            } else {
                return defaultValue
            }
        }
    }
    return undefined
}
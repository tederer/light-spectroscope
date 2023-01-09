/* global assertNamespace, spectroscope, __dirname */

assertNamespace('spectroscope');

var fs = require('fs');
   
spectroscope.getVersion = function getVersion() {
    var result;
    try {
        var fileContent = fs.readFileSync(__dirname + '/../../package.json', 'utf8');
        var packageJson = JSON.parse(fileContent);
        result = packageJson.version;
    } catch(e) {
        result = e;
    }
    return result;
};
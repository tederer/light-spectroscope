/* global assertNamespace, common, __dirname */

assertNamespace('common');

var fs = require('fs');
   
common.getVersion = function getVersion() {
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
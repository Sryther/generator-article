var jsonfile = require('jsonfile');

/**
 * Write a json file
 * @param  {array} data  A array of data
 */
module.exports = function(data) {
    var file = __dirname + '/../assets/lexique.json';
    jsonfile.writeFileSync(file, data, {spaces: 4});
};

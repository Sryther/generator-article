var jsonfile = require('jsonfile');

module.exports = function(data) {
    var file = __dirname + '/../assets/lexique.json';
    jsonfile.writeFileSync(file, data, {spaces: 4});
};

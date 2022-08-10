const conventor = require('./conventor');
fs = require('fs');

fs.readFile('input.html', 'utf8', (err, data) => {
    conventor(data, 'output', 'php');
});
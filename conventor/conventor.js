// code pulled from https://www.npmjs.com/package/html2hyperscript
fs = require('fs');
var Parser = require('htmlparser2').Parser;
var camel = require('to-camel-case');
var ent = require('ent');
var isEmpty = require('is-empty');
var thisIsSVGTag = require('./lib/svg-namespaces').thisIsSVGTag,
    getSVGNamespace = require('./lib/svg-namespaces').getSVGNamespace,
    getSVGAttributeNamespace = require('./lib/svg-namespaces').getSVGAttributeNamespace;

var elementStack = [];

function ItemList(parent) {
    this.parent = parent;
    this.content = [];
    this.spacer = '';
    this.indent = parent ? parent.indent : '';
    this.isFirstItem = true;
}

ItemList.prototype.addSpace = function (space) {
    this.spacer += space;

    if (space.indexOf("\n") !== -1) {
        // reset indent when there are new lines
        this.indent = /[^\n]*$/.exec(space)[0];
    } else {
        // otherwise keep appending to current indent
        this.indent += space;
    }
}

ItemList.prototype.add = function (data) {
    this.content.push(data);
}

ItemList.prototype.implodex = function (data) {
    const result = []
    Object.keys(data).forEach(key => {
        const value = `"${data[key]}"`
        result.push(`${key}: ${value}`)
    }) 

    return result.join(', ')
}

module.exports = function(html, outputFileName, lang = 'php') {
    var currentItemList = new ItemList(null);

    var parser = new Parser({
        onopentag: function (name, attribs) {
            currentItemList = new ItemList(currentItemList);

            if ('class' in attribs){
                attribs['className'] = attribs['class'];
                delete attribs['class'];
            }


            elementStack.unshift([ name, attribs ]);
        },
        ontext: function (text) {
            text = ent.decode(text).trim()
            if (text)
                currentItemList.add(JSON.stringify(text));
        },
        onclosetag: function (tagname) {
            var element = elementStack.shift();
            const tag = element[0];
            const props = element[1];
            const childs = currentItemList.content;

            const content = []


            if (lang=='php' && childs.length){
                const childStr = childs.length>1?childs.join(', '):childs[0]
                content.push(childStr)
            }

            if (Object.keys(props).length){
                content.push(currentItemList.implodex(props))
            }

            let item = `c${lang=='php'?'::':'.'}${tag}(${content.join(', ')})` 

            currentItemList = currentItemList.parent
            currentItemList.add(item);
        },
        oncomment: function (text) {
            
        },
        onend: function () {
            // console.log(currentItemList.content)
            console.log('ok')
            fs.writeFile(outputFileName + '.' + lang, currentItemList.content[0] + ';', (err) => {})
            // cb(null, currentItemList.content);
        }
    }, {decodeEntities: true, xmlMode: true});

    parser.write(html);
    parser.end();
}

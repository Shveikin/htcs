// code pulled from https://www.npmjs.com/package/html2hyperscript
var Parser = require('htmlparser2').Parser;
var ent = require('ent');

const beautify = require('js-beautify');


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

module.exports = function(html, output, lang = 'php') {
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
                let childStr = childs.join(',\n')
                if (childs.length!=1)
                    childStr = `[\n${childStr}\n]`
                content.push(childStr)
            }

            if (Object.keys(props).length){
                content.push((content.length?'\n':'') + currentItemList.implodex(props))
            }

            let item = `c${lang=='php'?'::':'.'}${tag}(\n${content.join(', ')}\n)\n` 

            currentItemList = currentItemList.parent
            currentItemList.add(item);
        },
        oncomment: function (text) {
            
        },
        onend: function () {
            const code = beautify(currentItemList.content[0]/* .join(';\n\n') */ + ';', { indent_size: 4, space_in_empty_paren: true })

            output(code)
        }
    }, {decodeEntities: true, xmlMode: true});

    parser.write(html);
    parser.end();
}

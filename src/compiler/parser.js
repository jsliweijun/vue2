/**
 * 对正则对熟悉程度
 */

const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 标签名
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //  用来获取的标签名的 match后的索引为1的
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配开始标签的
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配闭合标签的
//           aa  =   "  xxx "  | '  xxxx '  | xxx
const attribute =
    /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // a=b  a="b"  a='b'
const startTagClose = /^\s*(\/?)>/; //     />   <div/>
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{aaaaa}}

/**
 *  将解析后的结果，组装层一个树结构 ，通过 栈 实现。
 */
function createAstElement(tagName, attrs) {
    return {
        tag: tagName,
        type: 1,
        children: [],
        parent: null,
        attrs
    };
}

let root = null; // 根元素
let stack = [];

// 每遇见一个开始标签就创建一个 element 元素 ，然后放入栈中，构建树，记录parent
function start(tagName, attribute) {
    // console.log(tagName,attribute)
    let parent = stack[stack.length - 1];
    let element = createAstElement(tagName, attribute);
    if (!root) {
        root = element;
    }
    if (parent) {
        element.parent = parent; // 当放入栈中时，记录父亲是谁
        parent.children.push(element);
    }
    stack.push(element);
}
function end(tagName) {
    // console.log(tagName)
    let last = stack.pop();
    if (last.tag !== tagName) {
        throw new Error('标签有错误');
    }
}

function chars(text) {
    // console.log(text)
    text = text.replace(/\s/g, '');
    let parent = stack[stack.length - 1];
    if (text) {
        parent.children.push({ type: 3, text });
    }
}

// html 字符传解析成 对应的脚本 来触发 tokens <div id="app">{{name}}</div>
export function parserHTML(html) {
    function advance(len) {
        html = html.substring(len);
    }

    function parserStartTag() {
        const start = html.match(startTagOpen);
        //  console.log('parserStartTag start',start)
        if (start) {
            // match 不是 ast ，只是一个对象
            const match = {
                tagName: start[1],
                attrs: []
            };
            advance(start[0].length);
            // console.log(html) // id="app">{{name}}</div>

            // 进行匹配开始标签中的属性
            let end;
            let attr;
            //  如果没有遇到开始标签的结尾就不停的解析
            while (
                !(end = html.match(startTagClose)) &&
                (attr = html.match(attribute))
            ) {
                // console.log('attr',attr)
                match.attrs.push({
                    name: attr[1],
                    value: attr[3] || attr[4] || attr[5]
                });
                advance(attr[0].length); // 一边解析，一边删除
            }
            // 去掉开始标签的 > 字符
            if (end) {
                advance(end[0].length);
            }
            // console.log('处理完开始标签后的  html ',html)
            return match;
        }
        return false; // 不是开始标签
    }

    // 看要解析对内容是否存在，如果存在就不停的解析
    while (html) {
        let textEnd = html.indexOf('<');
        if (textEnd === 0) {
            const startTagMatch = parserStartTag(html); // 解析开始标签
            if (startTagMatch) {
                start(startTagMatch.tagName, startTagMatch.attrs);
                continue;
            }
            const endTagMatch = html.match(endTag);
            if (endTagMatch) {
                end(endTagMatch[1]);
                advance(endTagMatch[0].length);
            }
        }

        // -----
        let text; // 123123</div>  取到 123123 的文本内容
        if (textEnd > 0) {
            text = html.substring(0, textEnd);
        }
        if (text) {
            chars(text);
            advance(text.length);
        }
    }

    return root;
}

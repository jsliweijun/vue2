const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{aaaaa}}

// 要将 ast 的属性转换成字符串形式 [{name:'xx',value:'yy'}]  => xx=yy
function genProps(attrs) {
    let str = '';
    for (let i = 0; i < attrs.length; i++) {
        let attr = attrs[i];

        // 要处理样式  color:red;background:blue
        if (attr.name === 'style') {
            let styleObj = {};
            attr.value.replace(/([^;:]+)\:([^;:]+)/g, function () {
                styleObj[arguments[1]] = arguments[2];
            });
            attr.value = styleObj;
        }

        str += `${attr.name}:${JSON.stringify(attr.value)},`;
    }
    // a:1,b:2, 将最后一个 逗号去掉
    return `{${str.slice(0, -1)}}`;
}

function gen(el) {
    if (el.type == 1) {
        return generate(el);
    } else {
        let text = el.text;
        // 匹配 大括号 {{}}
        if (!defaultTagRE.test(text)) {
            return `_v('${text}')`;
        } else {
            console.log('11111111', text);
            // hello {{name}}  world 变成=》 'hello' + name + 'world'  ; name  是变量.
            let tokens = [];
            let match;
            let lastIndex = (defaultTagRE.lastIndex = 0); // 正则执行过一次之后会不在匹配了，需要重写进行。
            while ((match = defaultTagRE.exec(text))) {
                // 看有没有匹配到
                console.log('2222', match);
                let index = match.index; // 开始索引
                if (index > lastIndex) {
                    tokens.push(JSON.stringify(text.slice(lastIndex, index)));
                }

                // 这个变量有可能是对象
                tokens.push(`_s(${match[1].trim()})`); // _s 就是 JSON.stringfly()

                lastIndex = index + match[0].length;
            }
            if (lastIndex < text.length) {
                tokens.push(JSON.stringify(text.slice(lastIndex)));
            }

            return `_v(${tokens.join('+')})`;
        }
    }
}

function genChildren(el) {
    let children = el.children;
    if (children) {
        return children.map((c) => gen(c)).join(',');
    }
    return false;
}

// html 字符串 =》 字符串  _c('div',{id:'app',a:1},'hello')
// _c() 创建元素虚拟节点  _v() 创建文本的虚拟节点
// 目标： _c('div',{id:'app',a:1},'hello')
export function generate(el) {
    console.log('generate  ', el);

    let children = genChildren(el);

    // 遍历树，将树拼接成字符串 。 生成 儿子 需要不断遍历  children => '','','' 多个
    let code = `_c('${el.tag}' ,${
        el.attrs.length ? genProps(el.attrs) : 'undefined'
    } ${children ? ` , ${children}` : ''} )`;

    return code;
}

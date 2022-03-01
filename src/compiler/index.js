import { parserHTML } from './parser';
import { generate } from './generate';

// ast （语法层面的描述，js css html）  vdom （dom节点）

/**
 * 将模版内容转换成 render() 函数进行执行
 *    1. 解析 html，生成 AST 树
 *    2. 生成可执行的代码 code 。 类似变成了 React.createElement() 结构 js 代码
 *    3.
 */
export function compileToFunction(template) {
    // console.log('compileToFunction',template)
    let root = parserHTML(template);
    console.log('AST 树', root); // 这个 ast 树是一个 js 对象，描述成标签树的标签类型，层级.
    // 具体对象 {tag：div，attrs:{},children：[],type:1,parent:null}

    // 生成代码
    let code = generate(root);

    // 返回的是 js 代码,可用于进行创建虚拟 dom ，虚拟DOM 实现原理
    console.log('code: ', code); // code:  _c('div' ,{id:"app",test:"1",style:{"color":" red"," background-color":" aqua"}}  , _c('span' ,undefined  , _v("myage:"+_s(age)+"ssssss"+_s(test)+"'ssssss'") ),_v(_s(name)) )

    let render = new Function(`with(this){return ${code}}`);

    return render;

    // html => ast (只能描述语法，语法不存在的属性无法描述)  =>  render 函数 （new Function + with）
    // =》 虚拟 DOM （增加额外的属性） =》 生成真实 dom
}

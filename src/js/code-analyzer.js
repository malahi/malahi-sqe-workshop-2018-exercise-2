// import * as esprima from 'esprima';
let esprima = require('esprima');
let escodegen = require('escodegen');

let env = [[] , []];
let arg_env = [[] , []];
let update_env = [];
let if_flags = [];
let if_env = [[] , []];

const memIsParam = (name) =>{
    let str = '' , i = 0;
    while(name[i] !== '[' && i !== name.length ) {
        str = str + name[i];
        i++;
    }
    return str;
};

const addToEnv = (parsed_code , global_env ,param_env ) => {

    if (!param_env[0].includes(parsed_code.left.name)) {
        global_env[1].push(funcParsersRV[parsed_code.right.type](parsed_code.right, global_env, param_env));
        global_env[0].push(parsed_code.left.name);
    } else {

        param_env[1].push(funcParsersRV[parsed_code.right.type](parsed_code.right, global_env, param_env));
        param_env[0].push(parsed_code.left.name);
    }
};

const addMemToEnv = (parsed_code , global_env ,param_env) => {

    let value = calcTest('(' + parsed_code.left.object.name + '['+ parsed_code.left.property.raw +']' + '=' + funcParsersRV[parsed_code.right.type](parsed_code.right, global_env, param_env) + ');' + '(' + parsed_code.left.object.name +');' + ';') ;

    if (!param_env[0].includes(parsed_code.left.object.name)) {
        global_env[1].push(value);
        global_env[0].push(parsed_code.left.object.name);
    } else {
        param_env[1].push(value);
        param_env[0].push(parsed_code.left.object.name);
    }
};

const parenBalance = (str , counter , i) => {
    return str[i] === '['? counter + 1 : str[i] === ']'? counter - 1 : counter;
};

const balanceArray = (str) => {
    let counter = 0;
    for (let i = 0; i < str.length; i++) {
        counter = parenBalance(str , counter , i);
        if (counter > 0 && (str[i] === '\n' || str[i] === ' ') ){
            str = str.slice(0, i) + str.slice(i + 1);
            i--;
        }
    }
    return str;
};

const colorize = (code) => {
    let j = 0;
    let splited = code.split('\n');

    for (let i = 0; i < splited.length; i++){
        if(splited[i].includes('if')){
            if_flags[j]? splited[i] = '<markg>' + splited[i] + '</markg>': splited[i] = '<markr>' + splited[i] + '</markr>';
            j++;
        }
    }
    return splited;
};

const removeStatements = (param) => {
    return param.type === 'VariableDeclaration'? false: (param.type === 'ExpressionStatement'?
        (param.expression.left.type === 'MemberExpression' && arg_env[0].includes(param.expression.left.object.name))?true:arg_env[0].includes(param.expression.left.name) :true );
};

const cloneEnv = (env) =>{
    return [env[0].map((x)=>x) , env[1].map((x)=>x)];
};

const getArgs = (input) => {
    try{
        let inp = esprima.parseScript(input);
        return [inp.body[0].expression.expressions.map((x) => x.left.name) ,
            inp.body[0].expression.expressions.map((x) => escodegen.generate(x.right)) ];
    }catch (e) {
        try{
            let inp1 = esprima.parseScript(input);
            return [[inp1.body[0].expression.left.name] ,
                [escodegen.generate(inp1.body[0].expression.right)] ];
        }catch(e){
            return [[] , []];
        }
    }
};

const makeEvalStr = (env) =>{
    let str = '';
    for (let i = 0; i < env[0].length; i++){
        str = str + (i === 0? '(': '');
        str = str + env[0][i] + '=' + env[1][i];
        str = str + (i - env[0].length === -1? ');': ', ');
    }

    return str;
};

const calcTest = (test) => {
    let str = makeEvalStr(arg_env) + ' ' + makeEvalStr(env);
    let val = eval(str + ' ' + test );

    // return  val instanceof Array? JSON.stringify(val) : typeof val === 'string'? '\'' + val + '\'': String(val) ;
    return JSON.stringify(val);
};

const parseCode = (codeToParse , apply) => {
    update_env = [];
    if_flags = [];
    if_env = [[] , []];
    env = [[] , []];
    arg_env = [[] , []];

    let obj = esprima.parseScript(codeToParse , {range: true});
    arg_env = getArgs(apply);

    obj.body.map((x)=>{funcParsers[(x.type)](x , env , arg_env);});
    obj.body = obj.body.filter((param) => {return removeStatements(param);});

    return colorize(balanceArray( escodegen.generate(obj))).join('\n');
};

const parseHelper = (parsed_code , global_env , param_env) => {
    funcParsers[(parsed_code.type)](parsed_code , global_env , param_env);
};

const functionDeclarationP = (parsed_code , global_env , param_env) => {
    parseHelper(parsed_code.body , global_env , param_env);
};

const blockStatementP = (parsed_code , global_env , param_env) => {
    parsed_code.body.map((param) => { parseHelper(param , global_env , param_env);} );
    parsed_code.body = parsed_code.body.filter((param) => {return removeStatements(param); } );

};

const variableDeclarationP = (parsed_code , global_env , param_env) => {
    parsed_code.declarations.map((param) => {parseHelper(param , global_env , param_env);});
};

const variableDeclaratorP = (parsed_code , global_env , param_env) => {
    global_env[1].push(funcParsersRV[parsed_code.init.type](parsed_code.init, global_env, param_env));
    global_env[0].push(parsed_code.id.name);
};

const expressionStatementP = (parsed_code , global_env , param_env) =>
    parseHelper(parsed_code.expression , global_env , param_env);

const assignmentExpressionP = (parsed_code , global_env , param_env) => {
    parsed_code.right = esprima.parseScript(funcParsersRV[parsed_code.right.type](parsed_code.right , global_env , param_env)).body[0].expression;

    if(parsed_code.left.type === 'MemberExpression')
        addMemToEnv(parsed_code , global_env , param_env , parsed_code.left.object.name );
    else
        addToEnv(parsed_code , global_env , param_env);
};

const whileStatementP = (parsed_code , global_env , param_env) => {
    var new_env = cloneEnv(global_env);
    var param_new_env = cloneEnv(param_env);

    parsed_code.test = esprima.parseScript(funcParsersRV[parsed_code.test.type](parsed_code.test , new_env , param_new_env)).body[0].expression;

    parseHelper(parsed_code.body , new_env , param_new_env);
    arg_env = param_new_env;
};

const ifStatementP = (parsed_code , global_env , param_env ) => {
    var new_env = cloneEnv(global_env);
    var param_new_env = cloneEnv(param_env);
    parsed_code.test = esprima.parseScript(funcParsersRV[parsed_code.test.type](parsed_code.test , new_env , param_new_env)).body[0].expression;
    var test_flag = eval(calcTest('(' + escodegen.generate(parsed_code.test) + ');'));

    update_env.push(test_flag);
    if_flags.push(test_flag);

    parseHelper(parsed_code.consequent , new_env , param_new_env , true);
    if(if_env[0].length === 0 && test_flag && update_env.filter((x) => x === false).length === 0) {
        if_env = new_env;
        env[0] = if_env[0];
        env[1] = if_env[1];
    }
    update_env.pop();
    if( parsed_code.alternate != null ) {
        DITHelper(parsed_code.alternate, global_env, param_env);
    }
};

const DITHelper = (parsed_code , global_env , param_env) =>{
    var new_env = cloneEnv(global_env);
    var param_new_env = cloneEnv(param_env);
    parseHelper(parsed_code , new_env , param_new_env);

    if(parsed_code.type !== 'IfStatement' && if_env[0].length === 0 &&  (update_env.filter((x) => x === false).length === 0)){
        if_env = new_env;
        env[0] = if_env[0];
        env[1] = if_env[1];
    }
};

const returnStatementP = (parsed_code , global_env , param_env) => {

    var ret_value  = esprima.parseScript(funcParsersRV[parsed_code.argument.type](parsed_code.argument , global_env , param_env));
    parsed_code.argument = ret_value.body[0].expression;
};

const funcParsers  =  {
    'FunctionDeclaration': functionDeclarationP,
    'BlockStatement': blockStatementP,
    'VariableDeclaration': variableDeclarationP,
    'VariableDeclarator': variableDeclaratorP,
    'ExpressionStatement': expressionStatementP,
    'AssignmentExpression': assignmentExpressionP,
    'WhileStatement': whileStatementP,
    'IfStatement': ifStatementP,
    'ReturnStatement': returnStatementP,
};

const LiteralRV = (parsed_code) => {
    return parsed_code.raw;
};

const IdentifierRV = (parsed_code , global_env ) => {
    var local_index = global_env[0].lastIndexOf(parsed_code.name);
    return local_index !== -1? global_env[1][local_index] : parsed_code.name;
};

const BinaryExpressionRV = (parsed_code , global_env , param_env) => {
    let left  = funcParsersRV[parsed_code.left.type](parsed_code.left , global_env , param_env);
    let right = funcParsersRV[parsed_code.right.type](parsed_code.right , global_env , param_env);

    if(left === '0' )
        return right;
    if(right === '0')
        return left;

    if((parsed_code.operator === '*' || parsed_code.operator === '/'))
        return makeParnts(parsed_code , left , right);

    return  left + ' ' + parsed_code.operator + ' ' + right;

};

const makeParnts = (parsed_code ,left , right ) => {
    if( left.length > 1 && right.length > 1)
        return '(' + left + ')' + ' ' + parsed_code.operator + ' ' + '(' + right + ')';
    if( left.length > 1)
        return '(' + left + ')' + ' ' + parsed_code.operator + ' ' +  right ;
    if( right.length > 1)
        return left + ' ' + parsed_code.operator + ' ' +  '(' + right  + ')';

    return  left + ' ' + parsed_code.operator + ' ' + right;
};

const MemberExpressionRV = (parsed_code , global_env , param_env) => {
    let name = funcParsersRV[parsed_code.object.type](parsed_code.object , global_env , param_env);
    let mem  =  funcParsersRV[parsed_code.property.type](parsed_code.property , global_env , param_env);

    return !param_env[0].includes(memIsParam(name))? calcTest('(' + name +  '[' + mem + ']'+ ');') : name +  '[' + mem + ']';

};

const UnaryExpressionRV = (parsed_code , global_env , param_env) => {
    return parsed_code.operator +  '' + funcParsersRV[parsed_code.argument.type](parsed_code.argument , global_env , param_env);
};

const ArrayExpressionRV = (parsed_code , global_env , param_env) => {
    return  '[' + parsed_code.elements.map((x) => (funcParsersRV[x.type](x , global_env , param_env))) + ']' ;
};

const funcParsersRV = {
    'Literal': LiteralRV,
    'Identifier': IdentifierRV,
    'BinaryExpression': BinaryExpressionRV,
    'MemberExpression': MemberExpressionRV,
    'UnaryExpression': UnaryExpressionRV,
    'ArrayExpression': ArrayExpressionRV
};

module.exports = {parseCode};
// export {parseCode};

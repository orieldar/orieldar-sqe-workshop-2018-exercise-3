import * as esprima from 'esprima';
import * as astring from 'astring';
import * as estraverse from 'estraverse';



var inFunction = false;
var params = new Map();
var nodeMap = new Map();
var greenLines = [];
var redLines = [];
var ifColors =[];
var whileColors = [];
let genShape = '", shape="rectangle", fontsize="10.0';
let condShape = '", shape="diamond", fontsize="10.0';
let addGreen = '",style="filled", color="chartreuse3';


let firstRun = (ast,env,argenv,inputVector) => {
    estraverse.traverse(ast, {
        enter: function (node) {
            if (node.type == 'FunctionDeclaration'){
                inFunction = true;
                for (let i=0 ; i < node.params.length; i++){
                    let newNode = esprima.parseScript(JSON.stringify(inputVector[i])).body[0].expression;
                    argenv.set(node.params[i].name, newNode);
                }
            }
            else if( (node.type == 'VariableDeclarator' && !inFunction)) //globals
                argenv.set(node.id.name,node.init);
        },
        leave: function (node) {
            if (node.type == 'VariableDeclarator' && inFunction)
                nodeVariableDeclarator(node,env);
            else if (node.type == 'FunctionExpression' || node.type == 'FunctionDeclaration')
                inFunction = false;}
    });
};

let secondRun = (ast,env,argenv, currentEnv) => {
    let returnTree = estraverse.replace(ast, {
        enter: function (node) {
            if( secondRunMap[node.type] != undefined )
                secondRunMap[node.type](ast,env,argenv,node,currentEnv);
        }

    });
    return returnTree;
};

let secondRunIf = (ast,env,argenv,node) => {
    if (node.type == 'IfStatement' && node.visited!= true) {
        let tempMap = new Map(env);
        let tempArg = new Map(argenv);
        subExpression(node.test,env);
        colorStatement(node.test,env,argenv);
        node.visited = true;
        ifColors.push(node.test.color);
        traverse (node.consequent,tempMap,tempArg);
        traverse (node.alternate,env,argenv);
    }
};

let secondRunWhile = (ast,env,argenv, node,currentEnv) => {
    if (node.type == 'WhileStatement' && node.visited!= true) {
        subExpression(node.test,env);
        colorStatement(node.test,env,argenv);
        node.visited = true;
        whileColors.push(node.test.color);
        traverse (node.body,env,argenv);
        env = currentEnv;
    }
};

let secondRunAss = (ast,env,argenv,node) => {
    if(node.type == 'AssignmentExpression' && node.visited!= true){
        node.visited = true;
        subExpression(node.right,env);
        nodeAssignmentExpression(node,env,argenv);
        argAssignmentExpression(node,env,argenv);
    }
};

let secondRunVar = (ast,env,argenv,node) => {
    return subVarExpression(node,env);
};

let secondRunReturn = (ast,env,argenv,node) => {
    if(node.type == 'ReturnStatement' && node.visited!= true)
        node.visited = true;
    return subExpression(node.argument,env);
};

let secondRunMap = {};
secondRunMap.IfStatement = secondRunIf;
secondRunMap.WhileStatement = secondRunWhile;
secondRunMap.AssignmentExpression = secondRunAss;
secondRunMap.VariableDeclarator = secondRunVar;
secondRunMap.ReturnStatement = secondRunReturn;

let traverse = (ast, env, argenv, inputVector) => {
    firstRun(ast, env, argenv, inputVector);
    let currentEnv = env;
    let replacedTree = secondRun(ast, env, argenv, currentEnv);
    return replacedTree;
};


let updateCFG = (nodeArr) =>{
    let ifCounter = 0;
    let whileCounter = 0;
    for (let i = 0; i < nodeArr.length; i++) {
        //if (nodeArr[i].type === 'entry')
        //continue;
        //else{
        if (checkNormal(nodeArr[i])) {
            nodeArr[i].label =  `(${i})\n` + astring.generate(nodeArr[i].astNode) + genShape;
            nodeArr[i].color = 'green';
        } else if (checkIf(nodeArr[i]))
            ifCounter = updateIfCFG(nodeArr[i],ifCounter,i);
        else if (checkWhile(nodeArr[i]))
            whileCounter = updateWhileCFG(nodeArr[i],whileCounter,i);
        //}
    }
};

let checkNormal =(node) => {
    return (node.normal !== undefined && node.astNode.type != 'BlockStatement' );
};

let checkIf = (node) => {
    return (node.parent !== undefined && node.parent.type == 'IfStatement');
};

let checkWhile = (node) => {
    return (node.parent !== undefined && node.parent.type == 'WhileStatement');
};

let updateIfCFG = (node,ifCounter,num) => {
    if(ifColors[ifCounter] == 'green'){
        node.label =  `(${num})\n` + astring.generate(node.astNode) + condShape;
        node.true.thisWay = true;
    }
    else{
        node.label =  `(${num})\n` + astring.generate(node.astNode) + condShape;
        node.false.thisWay = true;
    }
    return ifCounter++;
};

let updateWhileCFG = (node,whileCounter,num) => {
    node.label =  `(${num})\n` + astring.generate(node.astNode) + condShape;
    if(whileColors[whileCounter] == 'green')
        node.true.toColor = true;
    return whileCounter++;
};

let colorCFG = (node) =>{
    if (node.next.length !=0){
        if (checkNormal(node) )
            normalHandler(node);
        else if (checkIf(node))
            ifHandler(node);
        else if (checkWhile(node)){
            whileHandler(node);
        }
    }
};

let updateIfColors= (arr) =>{
    ifColors = arr;
};

let updateWhileColors= (arr) =>{
    whileColors = arr;
};


let normalHandler = (node) => {
    node.label = node.label + addGreen;
    if( node.astNode.type == 'ReturnStatement')
        return;
    colorCFG(node.normal);
};
let ifHandler = (node) => {
    node.label = node.label + addGreen;
    if(node.true.thisWay == true)
        colorCFG(node.true);
    else
        colorCFG(node.false);
};
let whileHandler = (node) => {
    node.label = node.label + addGreen;
    if(node.true.toColor == true && node.colored != true ){
        node.colored = true;
        colorCFG(node.true);
    }
    colorCFG(node.false);
};


let subExpression = (ast,env) => {
    let subtree = estraverse.replace(ast, {
        leave: function (node,parent) {
            if (subIdentifierCheck(node,parent,env)){
                return env.get(node.name);
            }
            else if(node.type === 'MemberExpression' && node.object.type == 'Identifier' && env.has(node.object.name)){
                return env.get(node.object.name).elements[node.property.value];
            }
        },
    });
    return subtree;
};

let subIdentifierCheck = (node,parent,env) => {
    return (node.type === 'Identifier' && parent.type != 'MemberExpression' && env.has(node.name));
};


let subVarExpression = (ast,env) => {
    let subtree = estraverse.replace(ast, {
        enter: function (node,parent) {
            if (parent.init === node )
                return subExpression(node,env);
        }
    });
    return subtree;
};



let nodeVariableDeclarator = (node,env) => {
    env.set(node.id.name,node.init);
};

let nodeAssignmentExpression = (node,env) => {
    if (node.left.type == 'Identifier' && env.has(node.left.name) ){
        env.set(node.left.name,node.right);
    }
    else if(updateArrCheck(node,env)){
        env.get(node.left.object.name).elements[node.left.property.value] = node.right;
    }

};

let updateArrCheck = (node,env) => {
    return (node.left.type == 'MemberExpression' && node.left.object.type == 'Identifier' && env.has(node.left.object.name));
};

let argAssignmentExpression = (ast,env,argenv) => {
    if (ast.left.type == 'Identifier' && argenv.has(ast.left.name)){
        var cloneAst = esprima.parseScript(astring.generate(ast)).body[0].expression;
        let subtree = estraverse.replace(cloneAst.right, {
            leave: function (node,parent) {
                if (node.type === 'Identifier' && parent.type != 'MemberExpression'){
                    //if (argenv.has(node.name)){ קלט תקין
                    return (argenv.get(node.name));
                    //}
                }
            }
        });
        argenv.set(ast.left.name, subtree);
    }
};

let colorStatement = (test, env, argenv) => {
    var cloneTest = esprima.parseScript(astring.generate(test)).body[0].expression;
    estraverse.replace(cloneTest, {
        leave: function (node,parent) {
            if (node.type === 'Identifier' && parent.type != 'MemberExpression'){
                //if (argenv.has(node.name)){ קלט תקין
                return (argenv.get(node.name));
                //}
            }
            else if(checkArr(node,env,argenv)){
                return argenv.get(node.object.name).elements[node.property.value];
            }
        }
    });
    let bool = eval(astring.generate(cloneTest));
    bool? test.color = 'green' : test.color = 'red';

};

let checkArr = (node,env,argenv) => {
    return (node.type === 'MemberExpression' && node.object.type == 'Identifier' && argenv.has(node.object.name));
};



const parseCode = (codeToParse, inputVector) => {
    let parsed = esprima.parseScript(codeToParse, { loc: true });
    let newTree = traverse(parsed, nodeMap, params, inputVector);
    //linesToColor(newTree);
    return newTree;
};

export {updateIfColors, updateWhileColors};
export {ifHandler};
export {updateIfCFG};
export {updateWhileCFG};
export {greenLines};
export {redLines};
export {parseCode};
export {updateCFG};
export {colorCFG};
export {traverse};
export {firstRun};
export {secondRun};

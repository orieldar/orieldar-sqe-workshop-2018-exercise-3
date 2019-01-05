import assert from 'assert';
import {parseCode, firstRun, secondRun, updateCFG, colorCFG} from '../src/js/code-analyzer';
import * as astring from 'astring';
import * as esprima from 'esprima';
const esgraph = require('esgraph');
const Viz = require('viz.js');

describe('(1) The javascript program', () => {
    it('is substituting the tree correctly (if)', () => {
        let inputVector = `1,2,3`;
        let code = `function foo(x, y, z){
            let a = x + 1;
            let b = a + y;
            let c = 0;

            if (b < z) {
                c = c + 5;
                return x + y + z + c;
            } else if (b < z * 2) {
                c = c + x + 5;
                return x + y + z + c;
            } else {
                c = c + z + 5;
                return x + y + z + c;
            }
        }`;
        let mod =
         `function foo(x, y, z) {
  let a = x + 1;
  let b = x + 1 + y;
  let c = 0;
  if (x + 1 + y < z) {
    c = 0 + 5;
    return x + y + z + (0 + 5);
  } else if (x + 1 + y < z * 2) {
    c = 0 + x + 5;
    return x + y + z + (0 + x + 5);
  } else {
    c = 0 + z + 5;
    return x + y + z + (0 + z + 5);
  }
}
`
        let parsedCode = parseCode(code,inputVector);
        assert.equal(astring.generate(parsedCode) , mod );
    })});

    describe('(2) The javascript program', () => {
        it('is substituting the tree correctly (while fakse)', () => {
            let inputVector = `1,2,3`;
            let code = `function foo(x, y, z){
                let a = x + 1;
                let b = a + y;
                let c = 0;

                while (a < z) {
                    c = a + b;
                    z = c * 2;
                }

                return z;
            }
            `;
            let mod = `function foo(x, y, z) {
  let a = x + 1;
  let b = x + 1 + y;
  let c = 0;
  while (x + 1 < z) {
    c = x + 1 + (x + 1 + y);
    z = (x + 1 + (x + 1 + y)) * 2;
  }
  return z;
}
`
            let parsedCode = parseCode(code,inputVector);
            assert.equal(astring.generate(parsedCode),mod );
        })});

        describe('(3) The javascript program', () => {
            it('is substituting the tree correctly (array)', () => {
                let inputVector = `1,2,3`;
                let code = `function foo(x, y, z){
                    let a = x + 1;
                    let b = a + y;
                    let c = 0;
                    let d = [10,20,30];

                    if (d[0] < z) {
                        c = d[1];
                        return x + y + z + c;
                    } else{
                        c = c + x + 5;
                        return x + y + z + c;
                    }

                }
                `;
                let mod = `function foo(x, y, z) {
  let a = x + 1;
  let b = x + 1 + y;
  let c = 0;
  let d = [10, 20, 30];
  if (10 < z) {
    c = d[1];
    return x + y + z + 20;
  } else {
    c = 0 + x + 5;
    return x + y + z + (0 + x + 5);
  }
}
`
                let parsedCode = parseCode(code,inputVector);
                assert.equal(astring.generate(parsedCode),mod );
            })});

    describe('(4) The javascript program', () => {
                it('is substituting the tree correctly (array assignment)', () => {
                    let inputVector = `1,2,3`;
                    let code = `function foo(x, y, z){
                    let a = x + 1;
                    let b = a + y;
                    let c = 0;
                    let d = [10,20,30];

                    if (d[0] < z) {
                        d[1] = c;
                        return x + y + z + d[1];
                    } else{
                        d[1] = c + x + 5;
                        return x + y + z + d[1];
                    }

                }
                    `;
                    let mod = `function foo(x, y, z) {
  let a = x + 1;
  let b = x + 1 + y;
  let c = 0;
  let d = [10, 0 + x + 5, 30];
  if (10 < z) {
    d[1] = c;
    return x + y + z + 0;
  } else {
    d[1] = 0 + x + 5;
    return x + y + z + (0 + x + 5);
  }
}
`
                    let parsedCode = parseCode(code,inputVector);
                    assert.equal(astring.generate(parsedCode),mod );
                })});

                describe('(5) The javascript program', () => {
                    it('is substituting the tree correctly (while true)', () => {
                        let inputVector = `1,8,3`;
                        let code = `function foo(x, y, z){
                            let a = x + 1;
                            let b = a + y;
                            let c = 0;

                            while (a < z) {
                                c = a + b;
                                z = c * 2;
                            }

                            return z;
                        }
                        `;
                        let mod = `function foo(x, y, z) {
  let a = x + 1;
  let b = x + 1 + y;
  let c = 0;
  while (x + 1 < z) {
    c = x + 1 + (x + 1 + y);
    z = (x + 1 + (x + 1 + y)) * 2;
  }
  return z;
}
`
                        let parsedCode = parseCode(code,inputVector);
                        assert.equal(astring.generate(parsedCode),mod );
                    })});

                    describe('(6) The javascript program', () => {
                        it('is substituting the tree correctly (while in if)', () => {
                            let inputVector = `1,8,3`;
                            let code = `function foo(x, y, z){
let a = x + 1;
let b = a + y;
let c = 0;

   if (a < z) {
      while (b < z){
        c = a + b;
        z = c * 2;
      }
    return z;
    }
    else{
    return z;
    }
     }
                            `;
                            let mod = `function foo(x, y, z) {
  let a = x + 1;
  let b = x + 1 + y;
  let c = 0;
  if (x + 1 < z) {
    while (x + 1 + y < z) {
      c = x + 1 + (x + 1 + y);
      z = (x + 1 + (x + 1 + y)) * 2;
    }
    return z;
  } else {
    return z;
  }
}
`
                            let parsedCode = parseCode(code,inputVector);
                            assert.equal(astring.generate(parsedCode),mod );
                        })});


                        describe('(7) The javascript program', () => {
                                    it('is substituting the tree correctly (globals)', () => {
                                        let inputVector = `1,2,3`;
                                        let code = `
let g = 2;
function foo(x, y, z){
    while (x + 1 < z) {
        z = (x + 1 + x + 1 + y) * 2;
        y = x * g;
    }

    return z;
}
    `;
let mod = `let g = 2;
function foo(x, y, z) {
  while (x + 1 < z) {
    z = (x + 1 + x + 1 + y) * 2;
    y = x * g;
  }
  return z;
}
`
                                        let parsedCode = parseCode(code,inputVector);
                                        assert.equal(astring.generate(parsedCode),mod );
                                    })});

                                    describe('(8) The javascript program', () => {
                                                it('is substituting the tree correctly (globals2)', () => {
                                                    let inputVector = `1,2,3`;
                                                    let code = `
                                                    let g = [1,2,3];
                                                    let k =2;
                                                    function foo(x, y, z){

                                                        if (g[2] + 1 > z) {
                                                            z = (x + 1 + x + 1 + y) * 2;
                                                            y = x * g;
                                                        }
                                                    else{
                                                        return z;
                                                    }
                                                    }
                                                    `;
            let mod = `let g = [1, 2, 3];
let k = 2;
function foo(x, y, z) {
  if (g[2] + 1 > z) {
    z = (x + 1 + x + 1 + y) * 2;
    y = x * g;
  } else {
    return z;
  }
}
`
                                                    let parsedCode = parseCode(code,inputVector);
                                                    assert.equal(astring.generate(parsedCode),mod );
                                                })});


    describe('(9) The javascript program', () => {
        it('is substituting the tree correctly (second run check)', () => {
let inputVector = [1,2,3];
let env = new Map();
let argenv = new Map ();
let code = `let g = [1,2,3];
let k =2;
function foo(x, y, z){
    let a = x + z;
    if (g[2] + 1 > z) {
        z = (x + 1 + x + 1 + y) * 2;
        return a * g;
    }
else{
    return z;
}
}`;
let mod =
 `let g = [1, 2, 3];
let k = 2;
function foo(x, y, z) {
  let a = x + z;
  if (g[2] + 1 > z) {
    z = (x + 1 + x + 1 + y) * 2;
    return (x + z) * g;
  } else {
    return z;
  }
}
`
            let ast = esprima.parseScript(code, {loc: true});
            firstRun(ast,env,argenv,inputVector);
            let secondTree = secondRun(ast,env,argenv,new Map(env));
            assert.equal(astring.generate(secondTree) , mod );
        })});

        describe('(10) The javascript program', () => {
            it('is substituting the tree correctly (second run check)', () => {
    let inputVector = [1,2,3];
    let env = new Map();
    let argenv = new Map ();
    let code = `function foo(x, y, z){
    let a = x + 1;
    let b = a + y;
    let c = 0;

    if (b < z) {
        c = c + 5;
        return x + y + z + c;
    } else if (b < z * 2) {
        c = c + x + 5;
        return x + y + z + c;
    } else {
        c = c + z + 5;
        return x + y + z + c;
    }
}
`;
    let mod =
     `function foo(x, y, z) {
  let a = x + 1;
  let b = x + 1 + y;
  let c = 0;
  if (x + 1 + y < z) {
    c = 0 + 5;
    return x + y + z + (0 + 5);
  } else if (x + 1 + y < z * 2) {
    c = 0 + x + 5;
    return x + y + z + (0 + x + 5);
  } else {
    c = 0 + z + 5;
    return x + y + z + (0 + z + 5);
  }
}
`
                let ast = esprima.parseScript(code, {loc: true});
                firstRun(ast,env,argenv,inputVector);
                let secondTree = secondRun(ast,env,argenv,new Map(env));
                assert.equal(astring.generate(secondTree) , mod );
            })});

            describe('(11) The javascript program', () => {
                it('checks cfg correctly if true', () => {
        let inputVector = [1,2,3];
        let env = new Map();
        let argenv = new Map ();
        let codeToParse = `
        function foo(x, y, z){
            let a = x + 1;
            let b = a + y;
            let c = 0;

            if (b < z) {
                c = c + 5;
            } else if (b < z * 2) {
                c = c + x + 5;
            } else {
                c = c + z + 5;
            }

            return c;
        }


    `;

    let mod =

     `n0[label=\"entry\",style=\"rounded\"]n1[label=\"(1)leta=x+1;\
                    ",shape=\"rectangle\",fontsize=\"10.0\",style=\"filled\",color=\"chartreuse3\"]n
                    2[label=\"(2)letb=a+y;\",shape=\"rectangle\",fontsize=\"10.0\",style=\"filled\",
                    color=\"chartreuse3\"]n3[label=\"(3)letc=0;\",shape=\"rectangle\",fontsize=\"10.
                    0\",style=\"filled\",color=\"chartreuse3\"]n4[label=\"(4)b<z\",shape=\"diamond\"
                    ,fontsize=\"10.0\",style=\"filled\",color=\"chartreuse3\"]n5[label=\"(5)c=c+5\",
                    shape=\"rectangle\",fontsize=\"10.0\",style=\"filled\",color=\"chartreuse3\"]n6[
                    label=\"(6)returnc;\",shape=\"rectangle\",fontsize=\"10.0\",style=\"filled\",col
                    or=\"chartreuse3\"]n7[label=\"(7)b<z*2\",shape=\"diamond\",fontsize=\"10.0\"]n8[
                    label=\"(8)c=c+x+5\",shape=\"rectangle\",fontsize=\"10.0\"]n9[label=\"(9)c=c+z+5
                    \",shape=\"rectangle\",fontsize=\"10.0\"]n10[label=\"exit\",style=\"rounded\"]n0
                    ->n1[]n1->n2[]n2->n3[]n3->n4[]n4->n5[label=\"true\"]n4->n7[label=\"false\"]n5->n
                    6[]n6->n10[]n7->n8[label=\"true\"]n7->n9[label=\"false\"]n8->n6[]n9->n6[]`;
        let beforechange =  esprima.parseScript(codeToParse, { range: true });
        let parsedCode = parseCode(codeToParse,inputVector);
        let cfgBody = beforechange.body[0].body;
        let cfg = esgraph(cfgBody);
        updateCFG(cfg[2],parsedCode);
        colorCFG(cfg[0].normal);
        let dot = esgraph.dot(cfg , { counter: 0, source: codeToParse }).replace(/([n](\d+)[ ][-][>][ ][n](\d+)[ ][[]\w*(color="red", label="exception"]))/g, '');
        let dotToTest = dot.replace(/\s+/g, '')
        let modeToTest= mod.replace(/\s+/g, '')


                    assert.equal(dotToTest, modeToTest );
                })});


                describe('(12) The javascript program', () => {
                    it('checks cfg correctly with wile', () => {
                let inputVector = [1,2,3];
                let env = new Map();
                let argenv = new Map ();
                let codeToParse =
                      `

function foo(x, y, z){
while (x + 1 < z) {
z = (x + 1 + x + 1 + y) * 2;
y = x * 2;
}

return z;
}
`;

                let mod =
                `n0[label=\"entry\",style=\"rounded\"]n1[label=\"(1)x+1<z\",sh
        ape=\"diamond\",fontsize=\"10.0\",style=\"filled\",color=\"chartreuse3\",style=\
        "filled\",color=\"chartreuse3\"]n2[label=\"(2)z=(x+1+x+1+y)*2\",shape=\"rectangl
        e\",fontsize=\"10.0\",style=\"filled\",color=\"chartreuse3\"]n3[label=\"(3)y=x*2
        \",shape=\"rectangle\",fontsize=\"10.0\",style=\"filled\",color=\"chartreuse3\"]
        n4[label=\"(4)returnz;\",shape=\"rectangle\",fontsize=\"10.0\",style=\"filled\",
        color=\"chartreuse3\",style=\"filled\",color=\"chartreuse3\"]n5[label=\"exit\",s
        tyle=\"rounded\"]n0->n1[]n1->n2[label=\"true\"]n1->n4[label=\"false\"]n2->n3[]n3
        ->n1[]n4->n5[]`;
                let beforechange =  esprima.parseScript(codeToParse, { range: true });
                let parsedCode = parseCode(codeToParse,inputVector);
                let cfgBody = beforechange.body[0].body;
                let cfg = esgraph(cfgBody);
                updateCFG(cfg[2],parsedCode);
                colorCFG(cfg[0].normal);
                let dot = esgraph.dot(cfg , { counter: 0, source: codeToParse }).replace(/([n](\d+)[ ][-][>][ ][n](\d+)[ ][[]\w*(color="red", label="exception"]))/g, '');
                let dotToTest = dot.replace(/\s+/g, '')
                let modeToTest= mod.replace(/\s+/g, '')

                        assert.equal(dotToTest, modeToTest );
                    })});

        describe('(13) The javascript program', () => {
                        it('checks cfg correctly if false', () => {
                    let inputVector = [1,2,3];
                    let env = new Map();
                    let argenv = new Map ();
                    let codeToParse = `
                    function foo(x, y, z){
                    let a = x + 1;
                    let b = a + y;
                    let c = 0;

                    if (b > z) {
                        c = c + 5;
                    } else if (b < z * 2) {
                        c = c + x + 5;
                    } else {
                        c = c + z + 5;
                    }

                    return c;
                    }


                    `;

                    let mod =

                    `n0[label=\"entry\",style=\"rounded\"]n1[label=\"(1)leta=x+1;\
            ",shape=\"rectangle\",fontsize=\"10.0\",style=\"filled\",color=\"chartreuse3\"]n
            2[label=\"(2)letb=a+y;\",shape=\"rectangle\",fontsize=\"10.0\",style=\"filled\",
            color=\"chartreuse3\"]n3[label=\"(3)letc=0;\",shape=\"rectangle\",fontsize=\"10.
            0\",style=\"filled\",color=\"chartreuse3\"]n4[label=\"(4)b>z\",shape=\"diamond\"
            ,fontsize=\"10.0\",style=\"filled\",color=\"chartreuse3\"]n5[label=\"(5)c=c+5\",
            shape=\"rectangle\",fontsize=\"10.0\",style=\"filled\",color=\"chartreuse3\"]n6[
            label=\"(6)returnc;\",shape=\"rectangle\",fontsize=\"10.0\",style=\"filled\",col
            or=\"chartreuse3\"]n7[label=\"(7)b<z*2\",shape=\"diamond\",fontsize=\"10.0\"]n8[
            label=\"(8)c=c+x+5\",shape=\"rectangle\",fontsize=\"10.0\"]n9[label=\"(9)c=c+z+5
            \",shape=\"rectangle\",fontsize=\"10.0\"]n10[label=\"exit\",style=\"rounded\"]n0
            ->n1[]n1->n2[]n2->n3[]n3->n4[]n4->n5[label=\"true\"]n4->n7[label=\"false\"]n5->n
            6[]n6->n10[]n7->n8[label=\"true\"]n7->n9[label=\"false\"]n8->n6[]n9->n6[]`;
                    let beforechange =  esprima.parseScript(codeToParse, { range: true });
                    let parsedCode = parseCode(codeToParse,inputVector);
                    let cfgBody = beforechange.body[0].body;
                    let cfg = esgraph(cfgBody);
                    updateCFG(cfg[2],parsedCode);
                    colorCFG(cfg[0].normal);
                    let dot = esgraph.dot(cfg , { counter: 0, source: codeToParse }).replace(/([n](\d+)[ ][-][>][ ][n](\d+)[ ][[]\w*(color="red", label="exception"]))/g, '');
                    let dotToTest = dot.replace(/\s+/g, '')
                    let modeToTest= mod.replace(/\s+/g, '')
                            assert.equal(dotToTest, modeToTest );
                        })});

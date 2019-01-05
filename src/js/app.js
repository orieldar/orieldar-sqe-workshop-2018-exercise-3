import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {updateCFG} from './code-analyzer';
import {colorCFG} from './code-analyzer';
import * as esprima from 'esprima';

const esgraph = require('esgraph');
const Viz = require('viz.js');

$(document).ready(function () {
    $('#inputPlaceholder').val('1,2,3');
    $('#codePlaceholder').val('Enter Code Here');
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let inputVector = JSON.parse('[' + $('#inputPlaceholder').val() + ']');
        let beforechange =  esprima.parseScript(codeToParse, { range: true });
        let parsedCode = parseCode(codeToParse,inputVector);
        var cfgBody;
        for(let i=0; i< beforechange.body.length;i++)
            if (beforechange.body[i].type == 'FunctionDeclaration')
                cfgBody = beforechange.body[i].body;
        let cfg = esgraph(cfgBody);
        updateCFG(cfg[2],parsedCode);
        colorCFG(cfg[0].normal);
        let dot = esgraph.dot(cfg , { counter: 0, source: codeToParse }).replace(/([n](\d+)[ ][-][>][ ][n](\d+)[ ][[]\w*(color="red", label="exception"]))/g, '');
        let graph=Viz('digraph { '+dot+' }');
        colorLines(graph);
    });
});

let colorLines = (svg) => {
    document.getElementById('printedLines').innerHTML = svg;
};

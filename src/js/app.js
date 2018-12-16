import $ from 'jquery';
import {parseCode} from './code-analyzer';
// import Mark from 'mark.js/src/lib/mark';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let funcToParse = $('#funcPlaceholder').val();
        let parsedCode = parseCode(codeToParse , funcToParse);
        document.getElementById('parsedCode').innerHTML = parsedCode;

    });
});

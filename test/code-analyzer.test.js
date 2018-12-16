import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';



describe('The javascript parser', () => {
    it('1', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    if (b < z) {\n' +
                '        c = c + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else if (b < z * 2) {\n' +
                '        c = c + x + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else {\n' +
                '        c = c + z + 5;\n' +
                '        return x + y + z + c;\n' +
                '    }\n' +
                '}\n', '(x=1, y=2, z=3)'),

            'function foo(x, y, z) {\n' +
            '<markr>    if (x + 1 + y < z) {</markr>\n' +
            '        return x + y + z + 5;\n' +
            '<markg>    } else if (x + 1 + y < z * 2) {</markg>\n' +
            '        return x + y + z + x + 5;\n' +
            '    } else {\n' +
            '        return x + y + z + z + 5;\n' +
            '    }\n' +
            '}'
        );
    });

    it('2', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    while (a < z) {\n' +
                '        c = a + b;\n' +
                '        z = c * 2;\n' +
                '    }\n' +
                '    \n' +
                '    return z;\n' +
                '}\n' , '(x=1, y=2, z=3)'),

            'function foo(x, y, z) {\n' +
            '    while (x + 1 < z) {\n' +
            '        z = (x + 1 + x + 1 + y) * 2;\n' +
            '    }\n' +
            '    return z;\n' +
            '}'
        );
    });

    it('3', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    if (b < z) {\n' +
                '        c = c + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else if (b < z * 2) {\n' +
                '        c = c + x + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else {\n' +
                '        c = c + z + 5;\n' +
                '        return x + y + z + c;\n' +
                '    }\n' +
                '}\n' , '(x=1, y=2, z=3)'),

            'function foo(x, y, z) {\n' +
            '<markr>    if (x + 1 + y < z) {</markr>\n' +
            '        return x + y + z + 5;\n' +
            '<markg>    } else if (x + 1 + y < z * 2) {</markg>\n' +
            '        return x + y + z + x + 5;\n' +
            '    } else {\n' +
            '        return x + y + z + z + 5;\n' +
            '    }\n' +
            '}'
        );
    });

    it('4', () => {
        assert.equal(
            parseCode('function f(x , y , z){\n' +
                'let a = 5;\n' +
                'let b = x + 2 + z;\n' +
                'if(a > 1){\n' +
                'return b*2+2*b+b*b;}\n' +
                'else{\n' +
                ' if(a < 2){\n' +
                '  return y + z;\n' +
                ' }\n' +
                '}\n' +
                '\n' +
                'while(1 != 1){\n' +
                ' x = 1;\n' +
                '}\n' +
                '\n' +
                'z[1] = 2;\n' +
                '\n' +
                'return x + y + z;\n' +
                '}' , '(x=1, y=2, z=[1 , 2 ,3])'),

            'function f(x, y, z) {\n' +
            '<markg>    if (5 > 1) {</markg>\n' +
            '        return (x + 2 + z) * 2 + 2 * (x + 2 + z) + (x + 2 + z) * (x + 2 + z);\n' +
            '    } else {\n' +
            '<markr>        if (5 < 2) {</markr>\n' +
            '            return y + z;\n' +
            '        }\n' +
            '    }\n' +
            '    while (1 != 1) {\n' +
            '        x = 1;\n' +
            '    }\n' +
            '    z[1] = 2;\n' +
            '    return x + y + z;\n' +
            '}'


        );
    });

    it('5', () => {
        assert.equal(
            parseCode('function f(){\n' +
                'let a = 5;\n' +
                'a = 2;\n' +
                'return a + b;\n' +
                '}' ,  '()'),

            'function f() {\n' +
            '    return 2 + b;\n' +
            '}'
        );
    });

    it('6', () => {
        assert.equal(
            parseCode('function f(x,y,z){\n' +
                ' let a = [1 , 2 , 3];\n' +
                ' let b = a[1];\n' +
                ' let c = 0;\n' +
                ' let cc = -1;\n' +
                ' a[0] = b;\n' +
                ' x[0] = b;\n' +
                ' x = 2;\n' +
                ' if(x > 3){\n' +
                '  return x + c;\n' +
                ' } else if(b > 1) {\n' +
                '  return c + x;\n' +
                ' } else{\n' +
                '   return c + c;\n' +
                '  }\n' +
                '\n' +
                '\n' +
                ' return x + x\n' +
                '}' ,  '(x=1, y=\'abc\', z=[1,2,3])'),

            'function f(x, y, z) {\n' +
            '    x[0] = 2;\n' +
            '    x = 2;\n' +
            '<markr>    if (x > 3) {</markr>\n' +
            '        return x;\n' +
            '<markg>    } else if (2 > 1) {</markg>\n' +
            '        return x;\n' +
            '    } else {\n' +
            '        return 0;\n' +
            '    }\n' +
            '    return x + x;\n' +
            '}'
        );
    });

    it('7', () => {
        assert.equal(
            parseCode('function f(x){\n' +
                ' return x + x;\n' +
                '}' ,  '(x=1)'),

            'function f(x) {\n' +
            '    return x + x;\n' +
            '}'
        );
    });

    it('8', () => {
        assert.equal(
            parseCode('function f(x) {\n' +
                '\n' +
                'let a = 1;\n' +
                '\n' +
                'if(true){\n' +
                '   if(true){\n' +
                '     return 1; \n' +
                '   }else{ return 0; }\n' +
                '\n' +
                '}else if(false){\n' +
                '  if(false){\n' +
                '    return 2; \n' +
                '   } \n' +
                '   else{\n' +
                '     return 3;\n' +
                '    }\n' +
                '\n' +
                '}\n' +
                '\n' +
                'return x;\n' +
                '\n' +
                '}' ,  '(x=1)'),

            'function f(x) {\n' +
            '<markg>    if (true) {</markg>\n' +
            '<markg>        if (true) {</markg>\n' +
            '            return 1;\n' +
            '        } else {\n' +
            '            return 0;\n' +
            '        }\n' +
            '<markr>    } else if (false) {</markr>\n' +
            '<markr>        if (false) {</markr>\n' +
            '            return 2;\n' +
            '        } else {\n' +
            '            return 3;\n' +
            '        }\n' +
            '    }\n' +
            '    return x;\n' +
            '}'
        );
    });

    it('9', () => {
        assert.equal(
            parseCode('function f(x) {\n' +
                '\n' +
                'let a = 1;\n' +
                '\n' +
                'if(false){\n' +
                '   if(false){\n' +
                '     return 1; \n' +
                '   }else{ return 0; }\n' +
                '\n' +
                '}else if(true){\n' +
                '  if(true){\n' +
                '    return 2; \n' +
                '   } \n' +
                '   else{\n' +
                '     return 3;\n' +
                '    }\n' +
                '\n' +
                '}\n' +
                '\n' +
                'return x;\n' +
                '\n' +
                '}' ,  '(x=1)'),

            'function f(x) {\n' +
            '<markr>    if (false) {</markr>\n' +
            '<markr>        if (false) {</markr>\n' +
            '            return 1;\n' +
            '        } else {\n' +
            '            return 0;\n' +
            '        }\n' +
            '<markg>    } else if (true) {</markg>\n' +
            '<markg>        if (true) {</markg>\n' +
            '            return 2;\n' +
            '        } else {\n' +
            '            return 3;\n' +
            '        }\n' +
            '    }\n' +
            '    return x;\n' +
            '}'
        );
    });

    it('10', () => {
        assert.equal(
            parseCode('function f(x) {\n' +
                '\n' +
                'let a = 1;\n' +
                '\n' +
                'if(false){\n' +
                '   if(true){\n' +
                '     return 1; \n' +
                '   }else{ return 0; }\n' +
                '\n' +
                '}else if(true){\n' +
                '  if(false){\n' +
                '    return 2; \n' +
                '   } \n' +
                '   else{\n' +
                '     return 3;\n' +
                '    }\n' +
                '}\n' +
                'return x + 11;\n' +
                '}' ,  '(x=1)'),

            'function f(x) {\n' +
            '<markr>    if (false) {</markr>\n' +
            '<markg>        if (true) {</markg>\n' +
            '            return 1;\n' +
            '        } else {\n' +
            '            return 0;\n' +
            '        }\n' +
            '<markg>    } else if (true) {</markg>\n' +
            '<markr>        if (false) {</markr>\n' +
            '            return 2;\n' +
            '        } else {\n' +
            '            return 3;\n' +
            '        }\n' +
            '    }\n' +
            '    return x + 11;\n' +
            '}'
        );
    });

    it('11', () => {
        assert.equal(
            parseCode('function f(x) {\n' +
                'if(false){\n' +
                '}else if(true){\n' +
                '}\n' +
                '\n' +
                '}' ,  '(x=1)'),

            'function f(x) {\n' +
            '<markr>    if (false) {</markr>\n' +
            '<markg>    } else if (true) {</markg>\n' +
            '    }\n' +
            '}'
        );
    });

    it('12', () => {
        assert.equal(
            parseCode('function f(x){\n' +
                'x[0] = [3 , 1];\n' +
                'let a = [[1,5,[6]] ,2];\n' +
                'if(x[0][0] === a[0][2][0]){\n' +
                ' return x[0] + a;\n' +
                '} \n' +
                '}' ,  '(x=[1,2,3])'),

            'function f(x) {\n' +
            '    x[0] = [3,1];\n' +
            '<markr>    if (x[0][0] === 6) {</markr>\n' +
            '        return x[0] + [[1,5,[6]],2];\n' +
            '    }\n' +
            '}'
        );
    });
});

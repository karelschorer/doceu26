import type { Expr } from './parser';
import { type CellValue, numberValue, stringValue, errorValue, emptyValue, parseRef } from '../cell';

type CellGetter = (ref: string) => CellValue;
type RangeGetter = (from: string, to: string) => CellValue[];

export function evalFormula(expr: Expr, getCell: CellGetter, getRange: RangeGetter): CellValue {
  switch (expr.type) {
    case 'literal':
      return typeof expr.value === 'number' ? numberValue(expr.value) : stringValue(String(expr.value));

    case 'ref':
      return getCell(expr.ref);

    case 'range':
      return stringValue(`${expr.from}:${expr.to}`); // ranges evaluated in context

    case 'binary': {
      const l = evalFormula(expr.left, getCell, getRange);
      const r = evalFormula(expr.right, getCell, getRange);
      if (l.type === 'error') return l;
      if (r.type === 'error') return r;
      const lv = l.value as number;
      const rv = r.value as number;
      switch (expr.op) {
        case '+': return numberValue(lv + rv);
        case '-': return numberValue(lv - rv);
        case '*': return numberValue(lv * rv);
        case '/': return rv === 0 ? errorValue('#DIV/0!') : numberValue(lv / rv);
        case '^': return numberValue(Math.pow(lv, rv));
        default: return errorValue('#VALUE!');
      }
    }

    case 'unary': {
      const v = evalFormula(expr.expr, getCell, getRange);
      if (v.type === 'error') return v;
      return numberValue(-(v.value as number));
    }

    case 'call':
      return evalFunction(expr.name, expr.args, getCell, getRange);

    default:
      return errorValue('#VALUE!');
  }
}

function getNumbers(args: Expr[], getCell: CellGetter, getRange: RangeGetter): number[] {
  const nums: number[] = [];
  for (const arg of args) {
    if (arg.type === 'range') {
      const cells = getRange(arg.from, arg.to);
      for (const c of cells) {
        if (c.type === 'number') nums.push(c.value as number);
      }
    } else {
      const v = evalFormula(arg, getCell, getRange);
      if (v.type === 'number') nums.push(v.value as number);
    }
  }
  return nums;
}

function evalFunction(name: string, args: Expr[], getCell: CellGetter, getRange: RangeGetter): CellValue {
  const nums = () => getNumbers(args, getCell, getRange);
  switch (name) {
    case 'SUM': return numberValue(nums().reduce((a, b) => a + b, 0));
    case 'AVERAGE': { const n = nums(); return n.length ? numberValue(n.reduce((a, b) => a + b, 0) / n.length) : errorValue('#DIV/0!'); }
    case 'COUNT': return numberValue(nums().length);
    case 'MAX': { const n = nums(); return n.length ? numberValue(Math.max(...n)) : emptyValue; }
    case 'MIN': { const n = nums(); return n.length ? numberValue(Math.min(...n)) : emptyValue; }
    case 'ABS': { const v = evalFormula(args[0], getCell, getRange); return v.type === 'number' ? numberValue(Math.abs(v.value as number)) : errorValue('#VALUE!'); }
    case 'ROUND': { const v = evalFormula(args[0], getCell, getRange); const d = args[1] ? evalFormula(args[1], getCell, getRange) : numberValue(0); return v.type === 'number' ? numberValue(Math.round((v.value as number) * Math.pow(10, d.value as number)) / Math.pow(10, d.value as number)) : errorValue('#VALUE!'); }
    case 'IF': {
      const cond = evalFormula(args[0], getCell, getRange);
      const truthy = cond.value !== 0 && cond.value !== false && cond.value !== null && cond.value !== '';
      return evalFormula(truthy ? args[1] : args[2], getCell, getRange);
    }
    case 'CONCATENATE': {
      const parts = args.map((a) => evalFormula(a, getCell, getRange));
      return stringValue(parts.map((p) => String(p.value ?? '')).join(''));
    }
    case 'LEN': { const v = evalFormula(args[0], getCell, getRange); return numberValue(String(v.value ?? '').length); }
    case 'NOW': return numberValue(Date.now());
    default: return errorValue('#NAME?');
  }
}

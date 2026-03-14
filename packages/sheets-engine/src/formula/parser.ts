export type TokenType = 'NUMBER' | 'STRING' | 'REF' | 'FUNC' | 'OP' | 'LPAREN' | 'RPAREN' | 'COMMA' | 'COLON' | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
}

export type ExprType = 'literal' | 'ref' | 'range' | 'call' | 'binary' | 'unary';

export interface LiteralExpr { type: 'literal'; value: number | string | boolean }
export interface RefExpr { type: 'ref'; ref: string }
export interface RangeExpr { type: 'range'; from: string; to: string }
export interface CallExpr { type: 'call'; name: string; args: Expr[] }
export interface BinaryExpr { type: 'binary'; op: string; left: Expr; right: Expr }
export interface UnaryExpr { type: 'unary'; op: string; expr: Expr }

export type Expr = LiteralExpr | RefExpr | RangeExpr | CallExpr | BinaryExpr | UnaryExpr;

function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < formula.length) {
    const ch = formula[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(formula[i + 1] ?? ''))) {
      let n = '';
      while (i < formula.length && /[\d.]/.test(formula[i])) n += formula[i++];
      tokens.push({ type: 'NUMBER', value: n });
    } else if (ch === '"') {
      i++;
      let s = '';
      while (i < formula.length && formula[i] !== '"') s += formula[i++];
      i++;
      tokens.push({ type: 'STRING', value: s });
    } else if (/[A-Z]/i.test(ch)) {
      let name = '';
      while (i < formula.length && /[A-Z0-9]/i.test(formula[i])) name += formula[i++];
      if (i < formula.length && formula[i] === '(') {
        tokens.push({ type: 'FUNC', value: name.toUpperCase() });
      } else {
        tokens.push({ type: 'REF', value: name.toUpperCase() });
      }
    } else if (ch === '(') { tokens.push({ type: 'LPAREN', value: ch }); i++; }
    else if (ch === ')') { tokens.push({ type: 'RPAREN', value: ch }); i++; }
    else if (ch === ',') { tokens.push({ type: 'COMMA', value: ch }); i++; }
    else if (ch === ':') { tokens.push({ type: 'COLON', value: ch }); i++; }
    else if (/[+\-*/^<>=&]/.test(ch)) { tokens.push({ type: 'OP', value: ch }); i++; }
    else { i++; }
  }
  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

export function parseFormula(formula: string): Expr {
  const tokens = tokenize(formula.startsWith('=') ? formula.slice(1) : formula);
  let pos = 0;

  function peek(): Token { return tokens[pos]; }
  function consume(): Token { return tokens[pos++]; }
  function expect(type: TokenType): Token {
    const t = consume();
    if (t.type !== type) throw new Error(`Expected ${type}, got ${t.type}`);
    return t;
  }

  function parseExpr(): Expr { return parseAddSub(); }

  function parseAddSub(): Expr {
    let left = parseMulDiv();
    while (peek().type === 'OP' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const right = parseMulDiv();
      left = { type: 'binary', op, left, right };
    }
    return left;
  }

  function parseMulDiv(): Expr {
    let left = parseUnary();
    while (peek().type === 'OP' && (peek().value === '*' || peek().value === '/')) {
      const op = consume().value;
      const right = parseUnary();
      left = { type: 'binary', op, left, right };
    }
    return left;
  }

  function parseUnary(): Expr {
    if (peek().type === 'OP' && peek().value === '-') {
      consume();
      return { type: 'unary', op: '-', expr: parsePrimary() };
    }
    return parsePrimary();
  }

  function parsePrimary(): Expr {
    const t = peek();
    if (t.type === 'NUMBER') {
      consume();
      return { type: 'literal', value: parseFloat(t.value) };
    }
    if (t.type === 'STRING') {
      consume();
      return { type: 'literal', value: t.value };
    }
    if (t.type === 'REF') {
      consume();
      if (peek().type === 'COLON') {
        consume();
        const to = expect('REF').value;
        return { type: 'range', from: t.value, to };
      }
      return { type: 'ref', ref: t.value };
    }
    if (t.type === 'FUNC') {
      consume();
      expect('LPAREN');
      const args: Expr[] = [];
      while (peek().type !== 'RPAREN' && peek().type !== 'EOF') {
        args.push(parseExpr());
        if (peek().type === 'COMMA') consume();
      }
      expect('RPAREN');
      return { type: 'call', name: t.value, args };
    }
    if (t.type === 'LPAREN') {
      consume();
      const expr = parseExpr();
      expect('RPAREN');
      return expr;
    }
    throw new Error(`Unexpected token: ${t.type} "${t.value}"`);
  }

  return parseExpr();
}

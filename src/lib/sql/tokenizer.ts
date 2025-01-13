interface Token {
  type: string;
  value: string;
}

const tokenTypes: { type: string; regex: RegExp }[] = [
  { type: "WHITESPACE", regex: /^\s+/ },
  {
    type: "KEYWORD",
    regex:
      /^(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|INNER|OUTER|JOIN|ON|AND|OR|NOT|LIKE|GROUP|BY|HAVING|ORDER|LIMIT|OFFSET|DISTINCT|AS|CASE|WHEN|THEN|ELSE|END|UNION|ALL|ANY|EXISTS|IN|IS|NULL|BETWEEN|WITH|DESC|ASC|COUNT)\b(?!\.)/i,
  },
  { type: "IDENTIFIER", regex: /^(`?[a-zA-Z_][a-zA-Z0-9_.]*`?)/ },
  { type: "STRING", regex: /^(?:'(?:[^']|'')*'|"(?:[^"]|"")*")/ },
  { type: "NUMBER", regex: /^\d+(\.\d+)?/ },
  { type: "PLACEHOLDER", regex: /^:[a-zA-Z_][a-zA-Z0-9_]*/ },
  { type: "COMMENT", regex: /^(--[^\n]*|\/\*[\s\S]*?\*\/)/ },
  { type: "OPERATOR", regex: /^(=|<>|!=|<|>|<=|>=|\+|-|\*|\/)/ },
  { type: "PUNCTUATION", regex: /^[`,;()]/ },
];

export function tokenizeSql(sql: string): Token[] {
  try {
    const tokens: Token[] = [];
    let cursor = 0;
    const length = sql.length;

    while (cursor < length) {
      let matched = false;
      let subStr = "";
      for (const { type, regex } of tokenTypes) {
        subStr = sql.substring(cursor);
        const match = regex.exec(subStr);
        if (match) {
          tokens.push({ type, value: match[0] });
          cursor += match[0].length;
          matched = true;
          break;
        }
      }

      if (!matched) {
        return [...tokens, { type: "UNKNOWN", value: subStr }];
      }
    }
    return tokens;
  } catch (e) {
    return [{ type: "SQL", value: sql }];
  }
}

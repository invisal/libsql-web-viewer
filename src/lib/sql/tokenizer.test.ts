import { tokenizeSql } from "./tokenizer";

test("Select with placeholder and multiple lines comment", () => {
  const sql = `
    SELECT * FROM customers
    WHERE customer.id = :id and customer.name != "john:wich"
    /* This : is not placeholder */
  `;
  const tokens = tokenizeSql(sql);
  expect(tokens).toEqual([
    { type: "WHITESPACE", value: "\n    " },
    { type: "KEYWORD", value: "SELECT" },
    { type: "WHITESPACE", value: " " },
    { type: "OPERATOR", value: "*" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "FROM" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customers" },
    { type: "WHITESPACE", value: "\n    " },
    { type: "KEYWORD", value: "WHERE" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customer.id" },
    { type: "WHITESPACE", value: " " },
    { type: "OPERATOR", value: "=" },
    { type: "WHITESPACE", value: " " },
    { type: "PLACEHOLDER", value: ":id" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "and" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customer.name" },
    { type: "WHITESPACE", value: " " },
    { type: "OPERATOR", value: "!=" },
    { type: "WHITESPACE", value: " " },
    { type: "STRING", value: '"john:wich"' },
    { type: "WHITESPACE", value: "\n    " },
    { type: "COMMENT", value: "/* This : is not placeholder */" },
    { type: "WHITESPACE", value: "\n  " },
  ]);
  expect(tokens.map((t) => t.value).join("")).toBe(sql);
});
test("Select Tokenizer", () => {
  const sql = "SELECT `customer.id`, customer.name FROM `customers`";
  const tokens = tokenizeSql(sql);
  expect(tokens).toEqual([
    { type: "KEYWORD", value: "SELECT" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "`customer.id`" },
    { type: "PUNCTUATION", value: "," },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customer.name" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "FROM" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "`customers`" },
  ]);
  expect(tokens.map((t) => t.value).join("")).toBe(sql);
});

test("Insert Tokenizer", () => {
  const sql = "INSERT INTO customers (id, name) VALUES (1, 'John')";
  const tokens = tokenizeSql(sql);
  expect(tokens).toEqual([
    { type: "KEYWORD", value: "INSERT" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "INTO" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customers" },
    { type: "WHITESPACE", value: " " },
    { type: "PUNCTUATION", value: "(" },
    { type: "IDENTIFIER", value: "id" },
    { type: "PUNCTUATION", value: "," },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "name" },
    { type: "PUNCTUATION", value: ")" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "VALUES" },
    { type: "WHITESPACE", value: " " },
    { type: "PUNCTUATION", value: "(" },
    { type: "NUMBER", value: "1" },
    { type: "PUNCTUATION", value: "," },
    { type: "WHITESPACE", value: " " },
    { type: "STRING", value: "'John'" },
    { type: "PUNCTUATION", value: ")" },
  ]);
  expect(tokens.map((t) => t.value).join("")).toBe(sql);
});

test("Update Tokenizer", () => {
  const sql = "UPDATE customers SET name = 'John' WHERE id = 1";
  const tokens = tokenizeSql(sql);
  expect(tokens).toEqual([
    { type: "KEYWORD", value: "UPDATE" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customers" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "SET" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "name" },
    { type: "WHITESPACE", value: " " },
    { type: "OPERATOR", value: "=" },
    { type: "WHITESPACE", value: " " },
    { type: "STRING", value: "'John'" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "WHERE" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "id" },
    { type: "WHITESPACE", value: " " },
    { type: "OPERATOR", value: "=" },
    { type: "WHITESPACE", value: " " },
    { type: "NUMBER", value: "1" },
  ]);
  expect(tokens.map((t) => t.value).join("")).toBe(sql);
});

test("Delete Tokenizer", () => {
  const sql = "DELETE FROM customers WHERE id = 1";
  const tokens = tokenizeSql(sql);
  expect(tokens).toEqual([
    { type: "KEYWORD", value: "DELETE" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "FROM" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customers" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "WHERE" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "id" },
    { type: "WHITESPACE", value: " " },
    { type: "OPERATOR", value: "=" },
    { type: "WHITESPACE", value: " " },
    { type: "NUMBER", value: "1" },
  ]);
  expect(tokens.map((t) => t.value).join("")).toBe(sql);
});

test("Select with DISTINCT", () => {
  const sql = "SELECT DISTINCT name FROM customers";
  const tokens = tokenizeSql(sql);
  expect(tokens).toEqual([
    { type: "KEYWORD", value: "SELECT" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "DISTINCT" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "name" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "FROM" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customers" },
  ]);
  expect(tokens.map((t) => t.value).join("")).toBe(sql);
});

test("Select with JOIN", () => {
  const sql =
    "SELECT * FROM customers INNER JOIN orders ON customers.id = orders.customer_id";
  const tokens = tokenizeSql(sql);
  expect(tokens).toEqual([
    { type: "KEYWORD", value: "SELECT" },
    { type: "WHITESPACE", value: " " },
    { type: "OPERATOR", value: "*" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "FROM" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customers" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "INNER" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "JOIN" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "orders" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "ON" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customers.id" },
    { type: "WHITESPACE", value: " " },
    { type: "OPERATOR", value: "=" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "orders.customer_id" },
  ]);
  expect(tokens.map((t) => t.value).join("")).toBe(sql);
});

test("Select with GROUP BY", () => {
  const sql = "SELECT name, COUNT(*) FROM customers GROUP BY name";
  const tokens = tokenizeSql(sql);
  expect(tokens).toEqual([
    { type: "KEYWORD", value: "SELECT" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "name" },
    { type: "PUNCTUATION", value: "," },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "COUNT" },
    { type: "PUNCTUATION", value: "(" },
    { type: "OPERATOR", value: "*" },
    { type: "PUNCTUATION", value: ")" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "FROM" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customers" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "GROUP" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "BY" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "name" },
  ]);
  expect(tokens.map((t) => t.value).join("")).toBe(sql);
});

test("Select with ORDER BY", () => {
  const sql = "SELECT name FROM customers ORDER BY name DESC";
  const tokens = tokenizeSql(sql);
  expect(tokens).toEqual([
    { type: "KEYWORD", value: "SELECT" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "name" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "FROM" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customers" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "ORDER" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "BY" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "name" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "DESC" },
  ]);
  expect(tokens.map((t) => t.value).join("")).toBe(sql);
});

test("Select with LIMIT and OFFSET", () => {
  const sql = "SELECT name FROM customers LIMIT 10 OFFSET 5";
  const tokens = tokenizeSql(sql);
  expect(tokens).toEqual([
    { type: "KEYWORD", value: "SELECT" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "name" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "FROM" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customers" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "LIMIT" },
    { type: "WHITESPACE", value: " " },
    { type: "NUMBER", value: "10" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "OFFSET" },
    { type: "WHITESPACE", value: " " },
    { type: "NUMBER", value: "5" },
  ]);
  expect(tokens.map((t) => t.value).join("")).toBe(sql);
});

test("Select with CASE WHEN", () => {
  const sql =
    "SELECT CASE WHEN id = 1 THEN 'one' ELSE 'other' END AS result FROM customers";
  const tokens = tokenizeSql(sql);
  expect(tokens).toEqual([
    { type: "KEYWORD", value: "SELECT" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "CASE" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "WHEN" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "id" },
    { type: "WHITESPACE", value: " " },
    { type: "OPERATOR", value: "=" },
    { type: "WHITESPACE", value: " " },
    { type: "NUMBER", value: "1" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "THEN" },
    { type: "WHITESPACE", value: " " },
    { type: "STRING", value: "'one'" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "ELSE" },
    { type: "WHITESPACE", value: " " },
    { type: "STRING", value: "'other'" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "END" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "AS" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "result" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "FROM" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customers" },
  ]);
  expect(tokens.map((t) => t.value).join("")).toBe(sql);
});

test("Select with UNION", () => {
  const sql = "SELECT name FROM customers UNION SELECT name FROM orders";
  const tokens = tokenizeSql(sql);
  expect(tokens).toEqual([
    { type: "KEYWORD", value: "SELECT" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "name" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "FROM" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customers" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "UNION" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "SELECT" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "name" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "FROM" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "orders" },
  ]);
  expect(tokens.map((t) => t.value).join("")).toBe(sql);
});

test("Select with multiple placehoder", () => {
  const sql = "SELECT * FROM customers WHERE id = :id AND name = :name";
  const tokens = tokenizeSql(sql);
  expect(tokens).toEqual([
    { type: "KEYWORD", value: "SELECT" },
    { type: "WHITESPACE", value: " " },
    { type: "OPERATOR", value: "*" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "FROM" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customers" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "WHERE" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "id" },
    { type: "WHITESPACE", value: " " },
    { type: "OPERATOR", value: "=" },
    { type: "WHITESPACE", value: " " },
    { type: "PLACEHOLDER", value: ":id" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "AND" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "name" },
    { type: "WHITESPACE", value: " " },
    { type: "OPERATOR", value: "=" },
    { type: "WHITESPACE", value: " " },
    { type: "PLACEHOLDER", value: ":name" },
  ]);
  expect(tokens.map((t) => t.value).join("")).toBe(sql);
});

test("try to tokenize invalid sql", () => {
  const sql = "SELECT * FROM customers WHERE id = :id AND name = :123name";
  const tokens = tokenizeSql(sql);
  expect(tokens).toEqual([
    { type: "KEYWORD", value: "SELECT" },
    { type: "WHITESPACE", value: " " },
    { type: "OPERATOR", value: "*" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "FROM" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "customers" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "WHERE" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "id" },
    { type: "WHITESPACE", value: " " },
    { type: "OPERATOR", value: "=" },
    { type: "WHITESPACE", value: " " },
    { type: "PLACEHOLDER", value: ":id" },
    { type: "WHITESPACE", value: " " },
    { type: "KEYWORD", value: "AND" },
    { type: "WHITESPACE", value: " " },
    { type: "IDENTIFIER", value: "name" },
    { type: "WHITESPACE", value: " " },
    { type: "OPERATOR", value: "=" },
    { type: "WHITESPACE", value: " " },
    { type: "UNKNOWN", value: ":123name" },
  ]);
  expect(tokens.map((t) => t.value).join("")).toBe(sql);
});

test("try extra whitespace stay next to each other", () => {
  const sql = "SELECT   *  FROM  customers";
  const tokens = tokenizeSql(sql);
  expect(tokens.map((t) => t.value).join("")).toBe(sql);
  expect(tokens).toEqual([
    { type: "KEYWORD", value: "SELECT" },
    { type: "WHITESPACE", value: "   " },
    { type: "OPERATOR", value: "*" },
    { type: "WHITESPACE", value: "  " },
    { type: "KEYWORD", value: "FROM" },
    { type: "WHITESPACE", value: "  " },
    { type: "IDENTIFIER", value: "customers" },
  ]);
});

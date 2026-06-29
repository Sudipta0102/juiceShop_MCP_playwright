import Database from 'better-sqlite3';

const db = new Database('./container-data/juiceshop.sqlite', {
  readonly: true
});

const result = db.prepare(
  'SELECT COUNT(*) as count FROM Users'
).get();

console.log(result);

db.close();
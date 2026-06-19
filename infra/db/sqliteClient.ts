import Database from 'better-sqlite3';

const DATABASE_PATH = './container-data/juiceshop.sqlite';

// export const db = new Database(
//   DATABASE_PATH,
//   {
//     readonly: true
//   }
// ); 

export function createDatabaseConnection(): Database.Database {
  return new Database(DATABASE_PATH, {
    readonly: true
  });
}
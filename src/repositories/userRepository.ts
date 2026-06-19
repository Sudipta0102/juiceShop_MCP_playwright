import Database from "better-sqlite3";
import { User } from "../../container-data/types";

export function getUserByEmail(
    db: Database.Database,
    email: string): User | undefined{

        return db.prepare('SELECT * FROM Users WHERE email = ?').get(email);

}
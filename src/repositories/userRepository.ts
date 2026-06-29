import Database from "better-sqlite3";
import { User } from '../types/User';

export function getUserByEmail(
    db: Database.Database,
    email: string): User | undefined{

        return db.prepare<[string], User>('SELECT * FROM Users WHERE email = ?').get(email);

}
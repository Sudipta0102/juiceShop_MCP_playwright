import { db } from "../sqliteClient";

export function getUserByEmail(email: string){

    return db.prepare(`SELECT * 
    FROM Users 
    WHERE email=?`)
    .get(email);

}
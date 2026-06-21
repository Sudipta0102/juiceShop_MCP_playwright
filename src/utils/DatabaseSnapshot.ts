import Database  from "better-sqlite3";
import { DatabaseClient } from "./DatabaseClient";

/**
 * This blueprint represents a single state of a database so that a test could 
 * run multiple queries on single or multiple tables within a single state.
 * 
 */
export class DatabaseSnapshot{

    private readonly db: Database.Database;

    constructor(db: Database.Database){
        this.db = db;
    }

    /**
     * 
     * Executes a database query against this captured database state.
     * 
     * Example:
     * snapshot.execute( 
     *  db => UserRepository.getUserByMail(db, mail)
     * );
     */
    execute<T>(
        queryFn: (db:Database.Database) => T
    ): T{

        return queryFn(this.db);

    }

    /**
     * Gets a database instance when applicable.
     * 
     */
    // get connection(): Database.Database{

    //     return this.db;
    // }

    /**
     * closes the instance
     */
    close():void{

        DatabaseClient.close(this.db);
    }



}
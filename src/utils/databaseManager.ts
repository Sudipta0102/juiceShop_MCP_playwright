import Database from "better-sqlite3";

import { refreshDB } from "../../infra/db/refreshDB";
import { createDatabaseConnection } from "../../infra/db/sqliteClient";
import path from 'path';

export class DatabaseManager{

    /**
     * 
     * Observed behavior:
     *
     * Reopening the SQLite database without recreating the snapshot
     * continues to return stale data.
     *
     * To observe application-side database changes:
     *
     *    1. Refresh snapshot via docker cp
     *    2. Open a new SQLite connection
     *    3. Execute queries
     *
     * Refreshing the connection alone is insufficient.
     *  
     * Resposibilities: 
     * - Refreshes the database snapshot and returns a fresh SQLite connection. 
     * 
     */
    static getFreshDatabase(workerId: number): Database.Database{

        const snapshotDir = path.join(
            'container-data', `worker-${workerId}`
        );

        refreshDB(snapshotDir);

        //return createDatabaseConnection();
        return new Database(
            path.join(snapshotDir, 'juiceshop.sqlite'),
            {readonly: true}
        );
    }

  

    /** 
     * Closes the connection. 
    */
    static close(db: Database.Database): void{
        if(!db) return;
        
        if(db.open) db.close();
    }
}
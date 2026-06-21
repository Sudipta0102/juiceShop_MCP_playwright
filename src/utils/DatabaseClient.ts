import Database from "better-sqlite3";

import { refreshDB } from "../../infra/db/refreshDB";
import path from 'path';
import { DatabaseSnapshot } from "./DatabaseSnapshot";

export class DatabaseClient{

    private readonly workerId: number;
    private refreshCount = 0;

    constructor(workerId: number){
        this.workerId = workerId;
    }
    /**
     * 
     * Observed behavior:
     *
     * To observe changes made by the running Juice Shop application,
     * a fresh database snapshot must be copied from the container
     * before opening a new SQLite connection.
     *
     * Simply reusing an existing snapshot file will not reflect
     * newer application-side database changes.
     *
     * To observe application-side database changes:
     *
     *    1. Refresh snapshot via docker cp
     *    2. Open a new SQLite connection
     *    3. Execute queries
     * 
     * Lifecycle:
     * 
     * Container SQLite
     *        ↓
     *    docker cp
     *        ↓
     * worker snapshot
     *        ↓
     * open sqlite connection
     *        ↓
     *  DatabaseSnapshot
     *
     *  
     * Resposibilities: 
     * - Refreshes the worker-specific database snapshot
     * - Opens a SQLite connection against the refreshed snapshot
     * - Returns a DatabaseSnapshot instance for query execution
     * 
     */
    createSnapshot(): DatabaseSnapshot{

        const snapshotDir = path.join(
            'container-data', `worker-${this.workerId}`
        );

        refreshDB(snapshotDir);

        const db = new Database(
            path.join(snapshotDir, "juiceshop.sqlite"),
            {
                readonly: true
            }
        );

        this.refreshCount++;

        return new DatabaseSnapshot(db);
    }

    /**
     * Returns the number of snapshot refreshes performed
     * by this DatabaseClient instance.
     * 
     * @returns refresh count
     */
    getRefreshCount(): number{
        return this.refreshCount;
    }

    /** 
     * Closes the connection. 
    */
    static close(db: Database.Database): void{
        if(!db) {
            return;
        }
        
        if(db.open) {
            db.close();
        }    
    }
}
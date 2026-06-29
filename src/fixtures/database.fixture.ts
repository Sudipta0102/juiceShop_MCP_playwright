import { test as base } from '@playwright/test';
import { DatabaseClient } from '@util/DatabaseClient';

type DatabaseFixture = {
    dbClient: DatabaseClient;
}

export const test = base.extend<DatabaseFixture>({

    dbClient: [
     async ({}, use, testInfo)=>{

        const databaseClient = new DatabaseClient(testInfo.workerIndex);

        await use(databaseClient);

     },
     {scope: 'worker'}
    ]
});
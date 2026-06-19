import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

//const SNAPSHOT_DIR = './container-data';
const CONTAINER_NAME = 'juiceshop';
const CONTAINER_DB_PATH = '/juice-shop/data';
/**
 * Database snapshot utilities
 * 
 * Juiceshop store its data in an internal SQLite DB. To enable DB
 * assertions from playwright tests , the database files are copied 
 * from the running docker container into local snapshot dir (container-data).
 * 
 * Workflow: 
 * 1. Removes existing 'container-data' directory
 * 2. copies the latest db files form running 
 *    juice shop docker container.
 * 3. Creates a fresh snapshot that can be queried
 *    by SQLite utilities and automated tests.
 * 
 * It has nothing to do with liva db. Instead, it creates 
 * a ltest snapshot using:
 * docker cp juiceshop:/juice-shop/data ./container-data
 * 
 * Prerequisites:
 * - Docker desktop running
 * - Juice shop container is running
 * - Container name matches `CONTAINER_NAME`.
 * 
 * Example Usage Flow:
 * 
 * register user (UI)
 *         ↓
 *     refreshDB()
 *         ↓
 * Query SQLite snapshot
 *         ↓
 * Assert DB verifications
 * 
 * Throws Error when:
 * - existing snapshot cannot be removed
 * - copy operation failed
 */
export function refreshDB(snapshotDir: string): void {

  console.log(
    `Removing existing snapshot: ${snapshotDir}`
  );

  if (fs.existsSync(snapshotDir)) {
    fs.rmSync(snapshotDir, {
      recursive: true,
      force: true,
    });
  }

  // ensure the parent directories exist
  fs.mkdirSync(path.dirname(snapshotDir), { recursive: true });

  console.log(
    `Copying latest database into: ${snapshotDir}`
  );

  execSync(
    `docker cp ${CONTAINER_NAME}:${CONTAINER_DB_PATH} ${snapshotDir}`,
    {
      stdio: 'inherit',
    }
  );

  console.log(
    'Database snapshot refreshed successfully.'
  );
}

//allow this to run independently as a script
// if(require.main===module){
//     try{
//         refreshDB();
//     }catch(error){
//         console.error('Failed to refresh database snapshot');
//         console.error(error);
//         process.exit(1);
//     }
// }

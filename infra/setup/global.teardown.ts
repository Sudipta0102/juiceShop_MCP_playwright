import { execSync } from "node:child_process";

/**
 * This function is responsible for stopping container after the test finishes
 * 
 * * Playwright
 *   ↓
 * globalSetup()
 *   ↓
 * execSync()
 *   ↓
 * npm run app:start
 *   ↓
 * package.json
 *   ↓
 * docker compose up -d
 *   ↓
 * playwright test runner
 *   ↓
 * npm run app:stop
 *   ↓
 * docker compose down  
 */
async function globalTeardown():Promise<void> {
    
    console.log('Stopping Juice Shop...');

    execSync('npm run app:stop', {
        stdio: "inherit"
    });

    console.log('Juice Shop Stopped.');
}

export default globalTeardown;
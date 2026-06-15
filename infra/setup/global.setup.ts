import { execSync } from "node:child_process";
import { resolve } from "node:dns";

/**
 * This function will run before playwright test starts.
 * 
 * Responsibilities:
 * - Making sure Juice Shop container is running
 * - reuse existing one if already in place
 * - local and CI will use the same startup mechanism
 * 
 * Playwright
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
 */
async function globalSetup():Promise<void>{
    console.log('Juice Shop Starting...');

    execSync('npm run app:start', {
        stdio: 'inherit' // plug the child process directly into your current terminal.
    });

    await waitForApp();

    console.log('Juice Shop startup completed');
}

/**
 * 
 * THis function is reponsible for polling every 1sec when the
 * container is getting ready.
 * 
 * @returns 
 */
async function waitForApp(): Promise<void>{

    const timeout = Date.now() + 30000;

    while(Date.now() < timeout){

        try{
            const response = await fetch('http://localhost:8888');

            if(response.ok){
                return;
            }
        }catch {
            // Ignore connection errors while app is starting
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        
    }
    throw new Error('Juice Shop did not become available.');
}

export default globalSetup;
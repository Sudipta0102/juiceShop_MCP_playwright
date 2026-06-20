import { test as base } from '@playwright/test';
import { CustomApiClient } from "@util/CustomApiClient";

export type NetworkFixtures = {
    apiclient: CustomApiClient

}

export const networkTest = base.extend<NetworkFixtures>({

    apiclient: async ({request, page}, use)=>{

        // binding the current session directly to api client
        const client = new CustomApiClient(request, page);

        await use(client);
    }

    // future modification as soon as i write api login util
    //  apiClient: async ({ request, apiAuthenticatedPage }, use)=>{

    //     // binding the current session directly to custom api client.
    //     const client = new CustomApiClient(request, apiAuthenticatedPage);

    //     // handing over to test
    //     await use(client);

    // },


});
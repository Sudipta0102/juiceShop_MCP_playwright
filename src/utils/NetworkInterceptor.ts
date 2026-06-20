import { Page, Route } from "@playwright/test";

type RouteHandler = (route: Route) => Promise<void>;

/**
 * route.fulfill(): Fakes the Response data coming back to the UI.
 * route.continue(): Allows the request to continue, optionally modifying the request before sending it.
 * route.fetch(): Downloads the authentic Response data directly from the server.
 * route.abort(): Drops the network connection completely (simulates offline).
 * route.unroute(): Removes a previously registered route handler so future matching requests are no longer intercepted by it.
 * route.fallback(): Passes the request to the next matching route handler (or ultimately to the real server) instead of handling it completely.
 */
export class NetworkInterceptor{

    private readonly registeredRoutes : Array<string | RegExp> = [];

    private readonly page:Page;

    constructor(page: Page){
        this.page = page;
    }

    /**
     * This is the core interception primitive used internally by all
     * higher-level network mocking utilities like mockResponsePayload,
     * mockRequestPayload, modifyRealResponseProperty etc.
     * 
     * Responsibilities:
     * 
     * - Registers a playwright route handler
     * - Tracks route patterns for later cleanup
     * 
     * Note: 
     * - Allows future enhancements (logging, metrics, route replacement,
     *   debugging, registration guards, etc.) to be implemented once
     *   instead of modifying every network utility method
     * 
     * @param urlPattern urlPattern URL matcher used by Playwright route()
     * @param handler handler Custom route interception logic
     * 
     */
    async intercept(urlPattern: string | RegExp, handler: RouteHandler): Promise<void>{

        this.registeredRoutes.push(urlPattern); // needs for cleanup later

        // handler is function alias which take a Route returns Promise<void>.
        // By using this handler, I am going to abstract the page.route in every utility.
        await this.page.route(urlPattern, handler); 

    }

    /**
     * Intercepts any network and fulfills it with mocked payload and status code
     * 
     * @param crudMethod - HTTP Verb 'GET' | 'POST' | 'PUT' | 'DELETE'
     * @param urlPattern - Relative endpoint path or regex pattern to match
     * @param mockPayload 
     * @param statusCode - this is optional, 200 is default
     * 
     */
    async mockResponsePayload(
        crudMethod : 'GET' | 'POST' | 'PUT' | 'DELETE',
        urlPattern : string | RegExp,
        mockPayload : object,
        statusCode = 200 
    ): Promise<void>{

        // This implementation is withouy intercept
        // await this.page.route(urlPattern, async (route: Route) =>{

        //     //console.log('URL in mock response: ', route.request().url());
        //     // fulfill() never reaches the real server. It intercepts the
        //     // outgoing request inside the browser and immediately 
        //     // feeds the fake response that is sent by this method.
        //     // check if the ongoing request matches the request here.
        //     if(route.request().method() === crudMethod) {

        //         //console.log(`[MOCK SUCCESS] Intercepted ${crudMethod} request to: ${route.request().url()}. Injected mock payload data payload cleanly.`);

        //         await route.fulfill({
        //             status: statusCode,
        //             contentType: 'application/json',
        //             json: mockPayload, 
        //         });
        //     }else{
        //         await route.continue();
        //     }
        // })

        await this.intercept(
            urlPattern,
            async (route) =>{

                if(route.request().method()!= crudMethod){
                    await route.fallback();
                    return;
                }

                await route.fulfill({
                    status: statusCode,
                    contentType: 'application/json',
                    json: mockPayload, 
                });

            }
        );

    }

    /**
     * Modifies the request payload before it hits the server.
     * Preserves existing request configuration while replacing the outgoing request body.
     * 
     * @param urlPattern - Relative endpoint path or regex pattern to match
     * @param requestPayload
     * 
     */
    async mockRequestPayload(
        urlPattern : string | RegExp,
        requestPayload : object): Promise<void>{

        // await this.page.route(urlPattern, async (route)=>{
        //     await route.continue({
        //         postData: JSON.stringify(requestPayload),
        //     });
        // });    

        await this.intercept(
            urlPattern,
            async (route)=>{
                await route.continue(
                    {
                        postData: JSON.stringify(requestPayload),
                    }
                );
            } 
        );
    }

   
    /**
     * The request hits the real server normally using route.fetch(). 
     * Then, on its way back, Playwright intercepts the authentic response, 
     * allows you to edit the JSON body, and passes the modified data to the 
     * UI using route.fulfill().
     * 
     * @param urlPattern - Relative endpoint path or regex pattern to match
     * @param propertyTobeModifiedFn - Callback function that receives the live JSON body object, 
     * allowing you to manipulate complex nested structures natively using standard JavaScript 
     * array brackets and dot-notation.
     * 
     * @example
     * 
     * await networkMock.modifyRealResponse("\*\*\/api/events", (json) => {
     *     json.data.author.books[0].vol = "Volume 5";
     * });
     * 
     */
    async modifyRealResponseProperty(
        urlPattern : string | RegExp,
        responseModifier: (json: any) => void) : Promise<void>{

        // await this.page.route(urlPattern, async (route)=>{
        //     // 1. fetch the actual response first
        //     const response = await route.fetch();
        //     const responseJson = await response.json();

        //     // 2. inject the modified using callback
        //     propertyTobeModifiedFn(responseJson);

        //     // 3. serve the modfied payload back to the UI
        //     await route.fulfill({
        //         response: response,
        //         json: responseJson,
        //     });
        // });    

        await this.intercept(
            urlPattern,
            async (route)=>{

                // fetch the actual server response first
                const responseActual = await route.fetch();
                //parsing
                const responseActualJson = await responseActual.json();


                // inject the modified caller supplied response
                responseModifier(responseActualJson);

                // return the modified payload to the UI
                await route.fulfill(
                    {
                        response: responseActual,
                        json: responseActualJson
                    }
                );
            }

        );
    }

    /**
     * blocks the outgoing network
     * @param urlPattern - Relative endpoint path or regex pattern to match
     */
    async abortRequests(
        urlPattern:string | RegExp): Promise<void> {
        
        // this is without intercept method() 
        // await this.page.route(urlPattern, async (route)=>{
        //     await route.abort();
        // });    

        await this.intercept(
            urlPattern, 
            async (route) => {
                await route.abort();
            }    
        );

    }

    /**
     * Removes all routes registered through NetworkInterceptor instance
     * 
     * Without this:
     * every time page.route() registers something it will result
     * route accumulation, that in turn can produce
     * - unexpected route matches
     * - most importantly, as a subsequent result, 
     *   it will be very difficult debugging.
     * 
     * Planning to use this method inside test.aftereach()
     *     
     */
    async clearAllRoutes(): Promise<void>{

        for (const pattern of this.registeredRoutes){
            await this.page.unroute(pattern);
        }

        this.registeredRoutes.length = 0;
    }

    /**
     * Replaces any existing route registration for a URL pattern.
     * 
     * it makes sure, test does not register same route pattern multiple times.
     * 
     * Responsibilities:
     * - Previous handlers are removed of same pattern
     * 
     * Can be used when,
     * - overriding a mock response promarily
     * 
     * 
     * @param urlPattern 
     * @param handler 
     */
    async replaceRoute(urlPattern: string | RegExp, handler: RouteHandler): Promise<void>{

        await this.page.unroute(urlPattern);
    
        await this.intercept(
            urlPattern,
            handler
        );

    }
}


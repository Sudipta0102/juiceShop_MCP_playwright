import { type APIRequestContext, type Page } from "@playwright/test";


// so we are not using in built request fixture, instead we explicitly declare it 
// to have a memory of that browser session...as long as that test() in play 
// it will have the memory of the post or get request, this is State Preservation 
// ...this is the only reason 

// using in built fixture, if we do that, it will still have the memory of the request, 
// but it will be isolated instance...not tightly coupled with that test({apitest})
export class CustomApiClient{
    private readonly request: APIRequestContext;
    private readonly page: Page;

    constructor(request: APIRequestContext, page: Page){
        this.request = request;
        this.page = page;
    }

    private async getLatestToken(): Promise<string>{

        try{
            const token = await this.page.evaluate(() => {
                return window.localStorage.getItem('token');
            });
            return token || ''; // because sessionStorage.getitem either sends token or a null value.
        } catch {
            return ''; // this is when somehow the page is blank context 
        }

    }

    /**
     * 
     * Generic Post method
     * @param endpoint - relative bachend path (example: '/api/v1/events') 
     * @param payload - json dataset
     * 
     */
    // I have three options here, <T>, <T=unknown> and <T=any>
    // first two options will enforce to define a type interface
    // for every response json. As I am not really testing the
    // API's here, I dont want to have overhead of something
    // that is equivalent to JSON Deserialization.

    async post<T = any>(endpoint: string, payload?: object): Promise<T>{

        const token = await this.getLatestToken();

        //console.log('Token from post method: ', token);

        const response = await this.request.post(endpoint, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            data: payload,            
        });

        if(!response.ok()){

            const responseJson = await response.json();
            console.log('response json in post method: ', JSON.stringify(responseJson, null, 2));
            throw new Error(`POST resquest to ${endpoint} failed: ${response.statusText()}`);
        }

        return response.json();
    }


    /**
     * generic get method
     * @param endpoint 
     * @param options - e.g., endpoint?category=Festival&city=Mumbai
     */
    
    // Note: instead of options?: {params?: {[key: string] :string | number | boolean}}, if i give 
    // options?: {params?: object}, typescript complains it's too generic, gives compile time error. 
    // so it needs to have this key-value setup with more specific type declaration. That's why above 
    // works.
    // Note to self: Also, explore APIRequestContextOptions in this regard. Because its a configuration that one can set it up.
    // here APIRequestContextOptions might help.

    async get<T=any>(endpoint: string, options?: {params?: {[key: string] :string | number | boolean} }): Promise<T>{
    //async get<T=any>(endpoint:string, options: Record<string, string|number|boolean>): Promise<T>{

        const token = await this.getLatestToken();

        //console.log('Token from get method: ', token);

        const response = await this.request.get(endpoint, {
            headers: { Authorization: `Bearer ${token}`},
            params: options?.params,
        });

        if(!response.ok()){
            const responseJson = await response.json();
            console.log('response json in post method: ', JSON.stringify(responseJson, null, 2));
            throw new Error (`GET request to ${endpoint} failed: ${response.statusText()}`);
        }

        return response.json();
    }

    /**
     * generic put method
     * @param endpoint
     * @param payload
     */
    async put<T = any>(endpoint: string, payload: object): Promise<T>{

        const token = await this.getLatestToken();
        const response = await this.request.put(endpoint, {
            headers: { Authorization: `Bearer ${token}`},
            data: payload,           
        })

        if(!response.ok()){
            const responseJson = await response.json();
            console.log('response json in post method: ', JSON.stringify(responseJson, null, 2));
            throw new Error(`PUT request to ${endpoint} failed: ${response.statusText()}`);
        }

        return response.json();
    }

    /**
     * generic delete method
     * @param endpoint
     */
    async delete<T = any>(endpoint: string): Promise<T>{

        const token = await this.getLatestToken();
        const response = await this.request.delete(endpoint, {
            headers: { Authorization: `Bearer ${token}`},
        });

        if(!response.ok()){
            const responseJson = await response.json();
            console.log('response json in post method: ', JSON.stringify(responseJson, null, 2));
            throw new Error(`DELETE request to ${endpoint} failed: ${response.statusText()}`);
        }

        return response.json();
    }
}   
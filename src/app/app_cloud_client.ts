import type { Store } from "tauri-plugin-store-api";
import axios from 'axios';
import jwt from 'jsonwebtoken';

interface Tokens {
    access_token: string;
    refresh_token: string;
    id_token?: string;
}

export class AppCloudClient {
    private baseURL: string = 'http://localhost:1323/';
    private token: string = '';
    private refresh_token: string = '';

    private store: Store;

    constructor(store: Store) {
        this.store = store;
    }

    async get_user_salt(email: string): Promise<string> {
        const response = await axios.get(this.baseURL + 'user/salt', {
            params: {
                email: email
            }
        });
        return response.data;
    }

    // Get user tokens using code and verifier after login redirect
    async get_tokens(code: string, verifier: string): Promise<Tokens | null> {
        var options = {
            method: 'POST',
            url: 'https://dev-65toamv7157f23vq.us.auth0.com/oauth/token',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            data: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: 'ZBRZXrV3FrzvZfO3Zz8OCnKEwXnyxrDf',
                code_verifier: verifier,
                code: code,
                redirect_uri: 'http://localhost:1323/callback'
            })
        };

        let token_res = await axios.request(options).catch((error) => {
            console.log(error);
        });

        if (!token_res) {
            return null;
        }

        let result = {
            access_token: token_res.data.access_token,
            refresh_token: token_res.data.refresh_token,
            id_token: token_res.data.id_token
        }

        this.token = result.access_token;
        this.refresh_token = result.refresh_token;

        console.log('Token: ' + this.token);

        await this.save_refresh_token_to_store(this.refresh_token);

        return result;
    }

    // Get user tokens using refresh token
    async use_refresh_token(refresh_token: string): Promise<Tokens | null> {
        console.log('Using refresh token: ' + refresh_token);
        console.trace();
        var options = {
            method: 'POST',
            url: 'https://dev-65toamv7157f23vq.us.auth0.com/oauth/token',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            data: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: 'ZBRZXrV3FrzvZfO3Zz8OCnKEwXnyxrDf',
                refresh_token: refresh_token
            })
        };

        let token_res = await axios.request(options).catch((error) => {
            console.log(error);
        });

        if (!token_res) {
            return null;
        }

        let result = {
            access_token: token_res.data.access_token,
            refresh_token: token_res.data.refresh_token,
        }

        this.token = result.access_token;
        this.refresh_token = result.refresh_token;

        console.log('Token (By Refresh): ' + this.token);

        await this.save_refresh_token_to_store(this.refresh_token);

        return result;
    }

    private async load_refresh_token_from_store() {
        this.refresh_token = await this.store.get('refresh_token') || '';
    }

    private async save_refresh_token_to_store(refresh_token: string) {
        await this.store.set('refresh_token', this.refresh_token);
        await this.store.save();
    }

    async has_any_access_token(): Promise<boolean> {
        return (await this.has_refresh_token()) || this.has_access_token();
    }

    async has_refresh_token(): Promise<boolean> {
        return await this.store.has('refresh_token');
    }

    has_access_token(): boolean {
        return this.token.length > 0 && is_valid_jwt(this.token);
    }

    // Get access token directly from memory or using refresh token
    async get_token(): Promise<String> {
        if (this.token.length > 0 && is_valid_jwt(this.token)) {
            return this.token;
        }
        if (!(this.refresh_token.length > 0)) {
            await this.load_refresh_token_from_store();
        }
        if (this.refresh_token.length > 0) {
            await this.use_refresh_token(this.refresh_token);
            return this.token;
        }
        return '';
    }
}

function is_valid_jwt(token: string): boolean {
    const decodedToken = jwt_decode(token);
    if (!decodedToken) {
        return false;
    }
    const expirationTime = decodedToken.exp * 1000; // Convert expiration time to milliseconds
    const currentTime = Date.now();
    if (expirationTime < currentTime) {
        return false;
    } else {
        return true;
    }
}

function jwt_decode(token: string) {
    try {
        const decoded = jwt.decode(token, { complete: true });
        return decoded;
    } catch (err) {
        console.log(err);
        return null;
    }
}
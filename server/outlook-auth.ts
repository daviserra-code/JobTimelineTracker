import { Request, Response } from 'express';
import { storage } from './storage';

// Azure App Registration details should be in env vars
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const TENANT_ID = process.env.AZURE_TENANT_ID || 'common';
const REDIRECT_URI = process.env.AZURE_REDIRECT_URI || 'http://localhost:5005/api/auth/outlook/callback';

const SCOPES = [
    'User.Read',
    'Calendars.ReadWrite',
    'offline_access' // To get refresh token
];

const AUTH_ENDPOINT = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`;
const TOKEN_ENDPOINT = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

export class OutlookAuth {
    /**
     * Generates the Microsoft Login URL
     */
    static getAuthUrl(state: string): string {
        if (!CLIENT_ID) {
            throw new Error("AZURE_CLIENT_ID is not configured");
        }

        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            response_type: 'code',
            redirect_uri: REDIRECT_URI,
            response_mode: 'query',
            scope: SCOPES.join(' '),
            state: state
        });

        return `${AUTH_ENDPOINT}?${params.toString()}`;
    }

    /**
     * Exchanges authorization code for tokens
     */
    static async getTokens(code: string): Promise<any> {
        if (!CLIENT_ID || !CLIENT_SECRET) {
            throw new Error("Azure credentials are not configured");
        }

        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            scope: SCOPES.join(' '),
            code: code,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
            client_secret: CLIENT_SECRET
        });

        const response = await fetch(TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to exchange code for token: ${errorText}`);
        }

        return response.json();
    }

    /**
     * Refreshes access token using refresh token
     */
    static async refreshTokens(refreshToken: string): Promise<any> {
        if (!CLIENT_ID || !CLIENT_SECRET) {
            throw new Error("Azure credentials are not configured");
        }

        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            scope: SCOPES.join(' '),
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
            client_secret: CLIENT_SECRET
        });

        const response = await fetch(TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to refresh token: ${errorText}`);
        }

        return response.json();
    }
}

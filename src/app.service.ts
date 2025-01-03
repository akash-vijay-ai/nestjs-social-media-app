import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as base64 from 'base-64';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) { }

  async getTwitterAuthUrl(): Promise<string> {
    const clientId = this.configService.get<string>('CLIENT_ID_TWITTER');
    const redirectUri = this.configService.get<string>('REDIRECT_URI_TWITTER');
    return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=tweet.read%20users.read&state=random_string&code_challenge=challenge&code_challenge_method=plain`;
  }

  async exchangeTwitterCode(code: string): Promise<any> {
    const clientId = this.configService.get<string>('CLIENT_ID_TWITTER');
    const clientSecret = this.configService.get<string>('CLIENT_SECRET_TWITTER');
    const redirectUri = this.configService.get<string>('REDIRECT_URI_TWITTER');

    const authStr = `${clientId}:${clientSecret}`;
    const authBase64 = base64.encode(authStr);

    const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
    const payload = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: 'challenge',
    };
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authBase64}`,
    };

    const response = await axios.post(tokenUrl, payload, { headers });
    return response.data;
  }

  async fetchTwitterData(accessToken: string): Promise<any> {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const userUrl = 'https://api.twitter.com/2/users/me';
    const userResponse = await axios.get(userUrl, { headers });
    const userData = userResponse.data;

    const tweetsUrl = `https://api.twitter.com/2/users/${userData.data.id}/tweets`;
    const tweetsResponse = await axios.get(tweetsUrl, { headers });
    return tweetsResponse.data;
  }

  async getNotionAuthUrl(): Promise<string> {
    const clientId = this.configService.get<string>('CLIENT_ID_NOTION');
    const redirectUri = this.configService.get<string>('REDIRECT_URI_NOTION');
    return `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=offline_access`;
  }

  async exchangeNotionCode(code: string): Promise<any> {
    const clientId = this.configService.get<string>('CLIENT_ID_NOTION');
    const clientSecret = this.configService.get<string>('CLIENT_SECRET_NOTION');
    const redirectUri = this.configService.get<string>('REDIRECT_URI_NOTION');

    const tokenUrl = 'https://api.notion.com/v1/oauth/token';
    const data = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    };
    const encodedCredentials = base64.encode(`${clientId}:${clientSecret}`);
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${encodedCredentials}`,
    };

    const response = await axios.post(tokenUrl, data, { headers });
    return response.data;
  }

  async fetchNotionContent(accessToken: string): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Notion-Version': '2022-06-28',
    };

    const searchUrl = 'https://api.notion.com/v1/search';
    const searchPayload = { filter: { value: 'database', property: 'object' } };
    const searchResponse = await axios.post(searchUrl, searchPayload, { headers });
    const databases = searchResponse.data.results;

    const pages = [];
    for (const database of databases) {
      const databaseId = database.id;
      const queryUrl = `https://api.notion.com/v1/databases/${databaseId}/query`;
      const dbResponse = await axios.post(queryUrl, {}, { headers });
      pages.push(...dbResponse.data.results);
    }

    const standaloneResponse = await axios.post(searchUrl, { filter: { value: 'page', property: 'object' } }, { headers });
    pages.push(...standaloneResponse.data.results);

    const content = [];
    for (const page of pages) {
      const pageId = page.id;
      const blocksUrl = `https://api.notion.com/v1/blocks/${pageId}/children`;
      const blocksResponse = await axios.get(blocksUrl, { headers });
      content.push({
        page_id: pageId,
        title: page.properties?.title?.title?.[0]?.text?.content || 'Untitled',
        content: blocksResponse.data.results,
      });
    }

    return { content };
  }
}
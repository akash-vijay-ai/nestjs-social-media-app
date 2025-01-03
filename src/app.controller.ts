import { Controller, Get, Res, Req, Query } from '@nestjs/common';
import { Response, Request } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('/twitter')
  async twitterAuth(@Res() res: Response) {
    const authUrl = await this.appService.getTwitterAuthUrl();
    res.redirect(authUrl);
  }

  @Get('/twitter/callback')
  async twitterCallback(@Query('code') code: string, @Res() res: Response) {
    const tokens = await this.appService.exchangeTwitterCode(code);
    res.redirect(`/fetch_twitter_data?access_token=${tokens.access_token}`);
  }

  @Get('/fetch_twitter_data')
  async fetchTwitterData(@Query('access_token') accessToken: string) {
    return this.appService.fetchTwitterData(accessToken);
  }

  @Get('/notion')
  async notionAuth(@Res() res: Response) {
    const authUrl = await this.appService.getNotionAuthUrl();
    res.redirect(authUrl);
  }

  @Get('/notion/callback')
  async notionCallback(@Query('code') code: string, @Res() res: Response) {
    const tokens = await this.appService.exchangeNotionCode(code);
    res.redirect(`/fetch_notion_content?access_token=${tokens.access_token}`);
  }

  @Get('/fetch_notion_content')
  async fetchNotionContent(@Query('access_token') accessToken: string) {
    return this.appService.fetchNotionContent(accessToken);
  }
}
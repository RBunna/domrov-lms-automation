import { Controller, Get, Inject, NotFoundException, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { PaymentService } from './services/payment.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly paymentService: PaymentService, @Inject(CACHE_MANAGER) private cacheManager: Cache,) { }


  @Get('qr')
  createQr(@Query('amount') amount: string) {
    const qr = this.paymentService.createQR({ currency: 'USD', amount });
    const md5 = this.paymentService.generateMD5(qr);
    return { qr, md5 };
  }

  @Get('deeplink')
  async getDeeplink(@Query('qr') qr: string) {
    const link = await this.paymentService.generateDeeplink(qr);
    return { link };
  }

  @Get('status')
  async checkPayment(@Query('md5') md5: string) {
    const status = await this.paymentService.checkPayment(md5);
    return { status };
  }

  @Get('set-cache')
  async setCache(@Query('md5') md5: string) {
    await this.cacheManager.set(md5, "paid"); 
    console.log('Cache set for md5:', md5);
    return { message: `Cache set for ${md5}` };
  }

  @Get('cache')
  async getCache(@Query('md5') md5: string) {
    const result = await this.cacheManager.get(md5);
    console.log('Cache get for md5:', md5, 'value:', result);
    if(!result) throw new NotFoundException('No cache found for md5: ' + md5);
    return { md5, value: result };
  }

}
  
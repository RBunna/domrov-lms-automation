import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { PaymentService } from './services/payment.service';
import { TasksService } from './modules/tasks/tasks.service';
import { Tasks } from './libs/enums/taks.enum';
import { getDelayFromNow } from './libs/utils/CustomDateTime';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly paymentService: PaymentService ,private readonly taskService:TasksService) { }


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

  @Get('sentEmailNow')
  async sentEmail(@Query('md5') md5: string) {
    const nowPlus10Seconds = new Date(Date.now() + 10 * 1000);
    const status = await this.taskService.scheduleTask(Tasks.EMAIL_ALERT,{content:"Welcoem to code"}, getDelayFromNow(nowPlus10Seconds));
    console.log("Welcome to code")
    return { status };
  }
}
  
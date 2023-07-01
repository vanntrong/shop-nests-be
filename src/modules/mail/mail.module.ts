import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import configuration from '@/configs/configuration';
import { join } from 'path';
import { numberToVND } from '@/utils/currency';
import { checkOrderHasSale, getValueSale } from '@/utils/handleBars';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => {
        const config = configuration();
        console.log(config.mail);
        return {
          transport: {
            ...config.mail,
            tls: {
              ciphers: 'SSLv3',
            },
          },
          defaults: {
            from: '"No Reply" < 6151071109@st.utc2.edu.vn',
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter({
              formatCurrencyVND: numberToVND,
              checkOrderHasSale: checkOrderHasSale,
              getValueSale: getValueSale,
            }), // or new PugAdapter() or new EjsAdapter()
            options: {
              strict: true,
            },
          },
          options: {},
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}

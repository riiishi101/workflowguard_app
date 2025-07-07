import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { PrometheusController } from '@willsoto/nestjs-prometheus/dist/controller';
import { Public } from '../auth/public.decorator';

Public()(PrometheusController);

@Module({
  imports: [
    PrometheusModule.register(),
  ],
})
export class MetricsModule {} 
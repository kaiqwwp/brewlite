import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  /** Task 1 – “Hello”: kiểm tra backend chạy được. */
  @Get()
  hello() {
    return { message: 'Hello BrewLite', service: 'brewlite-backend' };
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }
}

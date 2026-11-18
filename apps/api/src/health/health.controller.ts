import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { Response } from 'express';
import { DataSource } from 'typeorm';
import { appVersion } from '../common/config';

@Controller()
export class HealthController {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  @Get()
  hello() {
    return { message: 'Hello BrewLite', service: 'brewlite-api', version: appVersion() };
  }

  /**
   * Health check cho nền tảng triển khai và smoke test của pipeline CD.
   * 200 khi API chạy và CSDL trả lời; 503 khi không kết nối được CSDL.
   */
  @Get('health')
  async health(@Res({ passthrough: true }) res: Response) {
    let db: 'up' | 'down' = 'up';
    let migrations: number | null = null;
    try {
      await this.ds.query('SELECT 1');
      const rows: { n: string }[] = await this.ds.query('SELECT COUNT(*)::int AS n FROM migrations');
      migrations = Number(rows[0]?.n ?? 0);
    } catch {
      db = 'down';
    }
    if (db === 'down') res.status(HttpStatus.SERVICE_UNAVAILABLE);
    return { status: db === 'up' ? 'ok' : 'error', db, migrations, version: appVersion(), uptime: Math.round(process.uptime()) };
  }
}

import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * Ghi một dòng log cho mỗi request: method, đường dẫn, mã trạng thái, thời gian xử lý.
 * LOG_FORMAT=json in dạng JSON để nền tảng log (Render) lọc được. Không bao giờ ghi
 * header Authorization, body hay query string (có thể chứa dữ liệu nhạy cảm).
 */
@Injectable()
export class RequestLogger implements NestMiddleware {
  private readonly log = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      const path = req.originalUrl.split('?')[0];
      if (path === '/health' && res.statusCode === 200) return; // health check gọi liên tục, không cần log
      const entry = { method: req.method, path, status: res.statusCode, ms: Math.round(ms * 10) / 10 };
      const line = process.env.LOG_FORMAT === 'json' ? JSON.stringify(entry) : `${entry.method} ${entry.path} ${entry.status} ${entry.ms}ms`;
      if (res.statusCode >= 500) this.log.error(line);
      else if (res.statusCode >= 400) this.log.warn(line);
      else this.log.log(line);
    });
    next();
  }
}

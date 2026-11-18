import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ENTITIES } from '../entities';

/**
 * Cấu hình CSDL dùng chung cho ứng dụng và TypeORM CLI.
 * Schema chỉ thay đổi qua migration (src/database/migrations), không dùng synchronize ở production.
 * migrationsTransactionMode 'all': mọi migration chưa chạy nằm trong MỘT transaction,
 * lỗi ở bất kỳ bước nào thì rollback toàn bộ, CSDL giữ nguyên phiên bản cũ.
 */
export function dataSourceOptions(): DataSourceOptions {
  const url = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/brewlite';
  return {
    type: 'postgres',
    url,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    entities: ENTITIES,
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    migrationsTableName: 'migrations',
    migrationsTransactionMode: 'all',
    synchronize: false,
  };
}

export default new DataSource(dataSourceOptions());

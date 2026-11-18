import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { Product } from '../../src/entities/product.entity';
import { Coupon } from '../../src/entities/coupon.entity';
import { User } from '../../src/entities/user.entity';

export interface TestCtx { app: INestApplication; ds: DataSource; http: () => ReturnType<typeof request> }

export async function createApp(): Promise<TestCtx> {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/brewlite_test';
  process.env.DB_DROP = 'true';
  process.env.SEED = 'false';
  process.env.JWT_SECRET = 'test-secret';
  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = mod.createNestApplication();
  configureApp(app);
  await app.init();
  await app.listen(0);
  return { app, ds: app.get(DataSource), http: () => request(app.getHttpServer()) };
}

let seq = 0;
export async function registerUser(ctx: TestCtx, name = 'user') {
  const email = `${name}${++seq}-${Date.now()}@test.local`;
  const res = await ctx.http().post('/auth/register').send({ email, password: 'secret123', name }).expect(201);
  return { email, id: res.body.user.id as number, token: res.body.accessToken as string };
}

export async function createStaff(ctx: TestCtx) {
  const email = `staff${++seq}@test.local`;
  await ctx.ds.manager.save(User, ctx.ds.manager.create(User, { email, name: 'staff', role: 'STAFF', passwordHash: await bcrypt.hash('staff123', 4) }));
  const res = await ctx.http().post('/auth/login').send({ email, password: 'staff123' }).expect(200);
  return { token: res.body.accessToken as string };
}

export async function createProduct(ctx: TestCtx, stock = 10, price = 45000, name = 'Cappuccino') {
  return ctx.ds.manager.save(Product, ctx.ds.manager.create(Product, { name, price, stock, imageUrl: '', description: '' }));
}

export async function createCoupon(ctx: TestCtx, c: Partial<Coupon>) {
  return ctx.ds.manager.save(Coupon, ctx.ds.manager.create(Coupon, { active: true, minTotal: 0, maxDiscount: null, expiresAt: null, ...c } as Coupon));
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
export const item = (productId: number, qty = 1, size = 'M', toppings: string[] = []) => ({ productId, qty, size, toppings });

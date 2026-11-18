import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1794971696733 implements MigrationInterface {
    name = 'InitialSchema1794971696733'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "loyalty_transactions" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "orderId" integer NOT NULL, "type" character varying NOT NULL, "points" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_df453f678b7575221b335673362" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_45879bef178075a29db0a3f392" ON "loyalty_transactions" ("orderId", "type") `);
        await queryRunner.query(`CREATE TABLE "orders" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "subtotal" integer NOT NULL, "discount" integer NOT NULL DEFAULT '0', "total" integer NOT NULL, "couponCode" character varying, "idempotencyKey" character varying, "pointsAwarded" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_dd369f541be59ba280e886423f" ON "orders" ("userId", "idempotencyKey") `);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" SERIAL NOT NULL, "orderId" integer NOT NULL, "productId" integer NOT NULL, "productName" character varying NOT NULL, "size" character varying NOT NULL, "toppings" text, "qty" integer NOT NULL, "unitPrice" integer NOT NULL, "lineTotal" integer NOT NULL, CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" SERIAL NOT NULL, "orderId" integer NOT NULL, "userId" integer NOT NULL, "idempotencyKey" character varying NOT NULL, "amount" integer NOT NULL, "method" character varying NOT NULL, "status" character varying NOT NULL, "reference" character varying, "failureReason" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_743b9fb1d2a059f2f7860418e4e" UNIQUE ("idempotencyKey"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL DEFAULT '', "price" integer NOT NULL, "imageUrl" character varying NOT NULL DEFAULT '', "stock" integer NOT NULL DEFAULT '0', "version" integer NOT NULL, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "promotions" ("code" character varying NOT NULL, "percentOff" integer NOT NULL, "minTotal" integer NOT NULL DEFAULT '0', "maxDiscount" integer, "active" boolean NOT NULL DEFAULT true, "expiresAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_8ab10e580f70c3d2e2e4b31ebf2" PRIMARY KEY ("code"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "name" character varying NOT NULL DEFAULT '', "passwordHash" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'CUSTOMER', "loyaltyPoints" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "promotions"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dd369f541be59ba280e886423f"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_45879bef178075a29db0a3f392"`);
        await queryRunner.query(`DROP TABLE "loyalty_transactions"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRelationsAndChecks1794971723916 implements MigrationInterface {
    name = 'AddRelationsAndChecks1794971723916'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "CHK_users_points_non_negative" CHECK ("loyaltyPoints" >= 0)`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "CHK_products_stock_non_negative" CHECK ("stock" >= 0)`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_cdb99c05982d5191ac8465ac010" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_cd8700988dded63ff38d3df58b2" FOREIGN KEY ("couponCode") REFERENCES "promotions"("code") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "FK_3288a03633857ba5656cff32dc4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "FK_04d051b97f5ea8f801026d61f43" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_af929a5f2a400fdb6913b4967e1" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_af929a5f2a400fdb6913b4967e1"`);
        await queryRunner.query(`ALTER TABLE "loyalty_transactions" DROP CONSTRAINT "FK_04d051b97f5ea8f801026d61f43"`);
        await queryRunner.query(`ALTER TABLE "loyalty_transactions" DROP CONSTRAINT "FK_3288a03633857ba5656cff32dc4"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_cd8700988dded63ff38d3df58b2"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_cdb99c05982d5191ac8465ac010"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "CHK_products_stock_non_negative"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "CHK_users_points_non_negative"`);
    }

}

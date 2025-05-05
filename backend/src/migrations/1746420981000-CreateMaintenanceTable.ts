import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMaintenanceTable1746420981000 implements MigrationInterface {
    name = 'CreateMaintenanceTable1746420981000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "plant" ("id" varchar PRIMARY KEY NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "name" varchar NOT NULL, "address" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "area" ("id" varchar PRIMARY KEY NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "name" varchar NOT NULL, "locationDescription" varchar NOT NULL, "plantId" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "equipment" ("id" varchar PRIMARY KEY NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "name" varchar NOT NULL, "manufacturer" varchar NOT NULL, "serialNumber" varchar NOT NULL, "initialOperationsDate" date NOT NULL, "areaId" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "part" ("id" varchar PRIMARY KEY NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "name" varchar NOT NULL, "type" varchar NOT NULL DEFAULT ('mechanical'), "manufacturer" varchar NOT NULL, "serialNumber" varchar NOT NULL, "installationDate" date NOT NULL, "equipmentId" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "maintenance" ("id" varchar PRIMARY KEY NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "title" varchar NOT NULL, "scheduledDate" date, "recurrence" varchar NOT NULL DEFAULT ('none'), "dueDate" date NOT NULL, "description" text, "partId" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "user" ("id" varchar PRIMARY KEY NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "name" varchar(100) NOT NULL, "email" varchar(100) NOT NULL, "password" varchar(255) NOT NULL, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"))`);
        await queryRunner.query(`CREATE TABLE "temporary_area" ("id" varchar PRIMARY KEY NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "name" varchar NOT NULL, "locationDescription" varchar NOT NULL, "plantId" varchar NOT NULL, CONSTRAINT "FK_e3964d97d9242c9b40f15cee3e1" FOREIGN KEY ("plantId") REFERENCES "plant" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_area"("id", "createdAt", "updatedAt", "name", "locationDescription", "plantId") SELECT "id", "createdAt", "updatedAt", "name", "locationDescription", "plantId" FROM "area"`);
        await queryRunner.query(`DROP TABLE "area"`);
        await queryRunner.query(`ALTER TABLE "temporary_area" RENAME TO "area"`);
        await queryRunner.query(`CREATE TABLE "temporary_equipment" ("id" varchar PRIMARY KEY NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "name" varchar NOT NULL, "manufacturer" varchar NOT NULL, "serialNumber" varchar NOT NULL, "initialOperationsDate" date NOT NULL, "areaId" varchar NOT NULL, CONSTRAINT "FK_63108a7875b1edbd0e3d2a6086b" FOREIGN KEY ("areaId") REFERENCES "area" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_equipment"("id", "createdAt", "updatedAt", "name", "manufacturer", "serialNumber", "initialOperationsDate", "areaId") SELECT "id", "createdAt", "updatedAt", "name", "manufacturer", "serialNumber", "initialOperationsDate", "areaId" FROM "equipment"`);
        await queryRunner.query(`DROP TABLE "equipment"`);
        await queryRunner.query(`ALTER TABLE "temporary_equipment" RENAME TO "equipment"`);
        await queryRunner.query(`CREATE TABLE "temporary_part" ("id" varchar PRIMARY KEY NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "name" varchar NOT NULL, "type" varchar NOT NULL DEFAULT ('mechanical'), "manufacturer" varchar NOT NULL, "serialNumber" varchar NOT NULL, "installationDate" date NOT NULL, "equipmentId" varchar NOT NULL, CONSTRAINT "FK_81a77b358baac63794a45618222" FOREIGN KEY ("equipmentId") REFERENCES "equipment" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_part"("id", "createdAt", "updatedAt", "name", "type", "manufacturer", "serialNumber", "installationDate", "equipmentId") SELECT "id", "createdAt", "updatedAt", "name", "type", "manufacturer", "serialNumber", "installationDate", "equipmentId" FROM "part"`);
        await queryRunner.query(`DROP TABLE "part"`);
        await queryRunner.query(`ALTER TABLE "temporary_part" RENAME TO "part"`);
        await queryRunner.query(`CREATE TABLE "temporary_maintenance" ("id" varchar PRIMARY KEY NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "title" varchar NOT NULL, "scheduledDate" date, "recurrence" varchar NOT NULL DEFAULT ('none'), "dueDate" date NOT NULL, "description" text, "partId" varchar NOT NULL, CONSTRAINT "FK_291768284faf7096d418c7113b2" FOREIGN KEY ("partId") REFERENCES "part" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_maintenance"("id", "createdAt", "updatedAt", "title", "scheduledDate", "recurrence", "dueDate", "description", "partId") SELECT "id", "createdAt", "updatedAt", "title", "scheduledDate", "recurrence", "dueDate", "description", "partId" FROM "maintenance"`);
        await queryRunner.query(`DROP TABLE "maintenance"`);
        await queryRunner.query(`ALTER TABLE "temporary_maintenance" RENAME TO "maintenance"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "maintenance" RENAME TO "temporary_maintenance"`);
        await queryRunner.query(`CREATE TABLE "maintenance" ("id" varchar PRIMARY KEY NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "title" varchar NOT NULL, "scheduledDate" date, "recurrence" varchar NOT NULL DEFAULT ('none'), "dueDate" date NOT NULL, "description" text, "partId" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "maintenance"("id", "createdAt", "updatedAt", "title", "scheduledDate", "recurrence", "dueDate", "description", "partId") SELECT "id", "createdAt", "updatedAt", "title", "scheduledDate", "recurrence", "dueDate", "description", "partId" FROM "temporary_maintenance"`);
        await queryRunner.query(`DROP TABLE "temporary_maintenance"`);
        await queryRunner.query(`ALTER TABLE "part" RENAME TO "temporary_part"`);
        await queryRunner.query(`CREATE TABLE "part" ("id" varchar PRIMARY KEY NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "name" varchar NOT NULL, "type" varchar NOT NULL DEFAULT ('mechanical'), "manufacturer" varchar NOT NULL, "serialNumber" varchar NOT NULL, "installationDate" date NOT NULL, "equipmentId" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "part"("id", "createdAt", "updatedAt", "name", "type", "manufacturer", "serialNumber", "installationDate", "equipmentId") SELECT "id", "createdAt", "updatedAt", "name", "type", "manufacturer", "serialNumber", "installationDate", "equipmentId" FROM "temporary_part"`);
        await queryRunner.query(`DROP TABLE "temporary_part"`);
        await queryRunner.query(`ALTER TABLE "equipment" RENAME TO "temporary_equipment"`);
        await queryRunner.query(`CREATE TABLE "equipment" ("id" varchar PRIMARY KEY NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "name" varchar NOT NULL, "manufacturer" varchar NOT NULL, "serialNumber" varchar NOT NULL, "initialOperationsDate" date NOT NULL, "areaId" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "equipment"("id", "createdAt", "updatedAt", "name", "manufacturer", "serialNumber", "initialOperationsDate", "areaId") SELECT "id", "createdAt", "updatedAt", "name", "manufacturer", "serialNumber", "initialOperationsDate", "areaId" FROM "temporary_equipment"`);
        await queryRunner.query(`DROP TABLE "temporary_equipment"`);
        await queryRunner.query(`ALTER TABLE "area" RENAME TO "temporary_area"`);
        await queryRunner.query(`CREATE TABLE "area" ("id" varchar PRIMARY KEY NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "name" varchar NOT NULL, "locationDescription" varchar NOT NULL, "plantId" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "area"("id", "createdAt", "updatedAt", "name", "locationDescription", "plantId") SELECT "id", "createdAt", "updatedAt", "name", "locationDescription", "plantId" FROM "temporary_area"`);
        await queryRunner.query(`DROP TABLE "temporary_area"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "maintenance"`);
        await queryRunner.query(`DROP TABLE "part"`);
        await queryRunner.query(`DROP TABLE "equipment"`);
        await queryRunner.query(`DROP TABLE "area"`);
        await queryRunner.query(`DROP TABLE "plant"`);
    }

}

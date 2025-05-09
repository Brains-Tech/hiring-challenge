import {
    PrimaryGeneratedColumn,
    BaseEntity as TypeOrmBaseEntity,
    Column,
} from 'typeorm';

export abstract class ModelBase extends TypeOrmBaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}
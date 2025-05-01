import { Entity, Column } from 'typeorm';
import { ModelBase } from './ModelBase';


@Entity()
export class User extends ModelBase {
    @Column({ type: 'varchar', length: 100, nullable: false })
    name: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255 })
    password: string;
}
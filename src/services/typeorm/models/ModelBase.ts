import { PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn} from "typeorm";



// rinominare come "ModelTypeormBase"
export class ModelBase {

    @PrimaryGeneratedColumn("uuid")
    id?: string;

    // TIMESTAMPS
    @UpdateDateColumn()
    updatedDate?: Date;

    @CreateDateColumn()
    createdDate?: Date;

}
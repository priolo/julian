# Component: `typeorm`

The `typeorm` component acts as the Database Connection Provider for the Julian framework. Based on the popular `typeorm` library, it initializes `DataSource`, stores models/schemas, and aggregates database entities from its children nodes (`typeorm-repo`).

## Configuration Identity
```json
{
    "class": "typeorm"
}
```

## JSON / TypeScript Schema (`TypeormServiceConf`)

```typescript
import { DataSourceOptions, EntitySchemaOptions } from "typeorm";

interface TypeormServiceConf {
    class: "typeorm";
    name?: string; 
    
    /** Core TypeORM configuration mapping mapping */
    options?: DataSourceOptions & {
        /** e.g. "sqlite", "postgres", "mysql" */
        type: string; 
        database?: string;     // URL / File path 
        synchronize?: boolean; // Set true for dev syncing mappings 
        logging?: boolean;     // Enable raw SQL logs
        entities?: any[];      // Extra schema locators
    };
    
    /** Specific standalone explicit entity payloads */
    schemas?: EntitySchemaOptions<any>[];
    
    /** 
     * Repo classes extending TypeormRepoBaseService which contain distinct 
     * `.model` Entity classes 
     */
    children?: any[]; 
}
```

## Child Repositories 

The real power of Julian `typeorm` is the abstract `TypeormRepoBaseService`. Children extending this base register themselves internally, making the Entity available centrally, but acting as independent REST/BUS action handlers.

Example Custom Repo JSON mapping:

```typescript
export class UserRepo extends typeorm.RepoService {
    get stateDefault() {
        return {
            ...super.stateDefault,
            model: UserEntity, 
            seeds: []
        };
    }
}
```

## Bus Actions

On any specific Repo Child, dispatch actions mapping directly to database states:
- `FIND`: Requires `{ query: FindManyOptions }`, returns `any[]`
- `FIND_ONE`: Requires `{ query: FindOneOptions }`, returns `any`
- `FIND_AND_COUNT`: Returns `[any[], count]`
- `SEED`: Executes raw SQL / specific seed inserts.
- `TRUNCATE` / `CLEAR`: Wipes target table.
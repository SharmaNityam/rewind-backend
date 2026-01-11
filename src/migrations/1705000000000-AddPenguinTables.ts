import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddPenguinTables1705000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_penguin_states table
    await queryRunner.createTable(
      new Table({
        name: 'user_penguin_states',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'energy',
            type: 'int',
            default: 50,
          },
          {
            name: 'mood',
            type: 'int',
            default: 50,
          },
          {
            name: 'trust',
            type: 'int',
            default: 50,
          },
          {
            name: 'last_updated',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'user_penguin_states',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // Create user_penguin_memories table
    await queryRunner.createTable(
      new Table({
        name: 'user_penguin_memories',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'week_avg_mood',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'dominant_emotion',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'talk_preference',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'last_updated',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'user_penguin_memories',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const stateTable = await queryRunner.getTable('user_penguin_states');
    if (stateTable) {
      const stateForeignKey = stateTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('user_id') !== -1
      );
      if (stateForeignKey) {
        await queryRunner.dropForeignKey('user_penguin_states', stateForeignKey);
      }
    }

    const memoryTable = await queryRunner.getTable('user_penguin_memories');
    if (memoryTable) {
      const memoryForeignKey = memoryTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('user_id') !== -1
      );
      if (memoryForeignKey) {
        await queryRunner.dropForeignKey('user_penguin_memories', memoryForeignKey);
      }
    }

    // Drop tables
    await queryRunner.dropTable('user_penguin_states');
    await queryRunner.dropTable('user_penguin_memories');
  }
}

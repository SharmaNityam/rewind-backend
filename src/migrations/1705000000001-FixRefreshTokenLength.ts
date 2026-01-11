import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class FixRefreshTokenLength1705000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alter the token column from VARCHAR(255) to TEXT
    await queryRunner.changeColumn(
      'refresh_tokens',
      'token',
      new TableColumn({
        name: 'token',
        type: 'text',
        isUnique: true,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to VARCHAR(255)
    await queryRunner.changeColumn(
      'refresh_tokens',
      'token',
      new TableColumn({
        name: 'token',
        type: 'varchar',
        length: '255',
        isUnique: true,
        isNullable: false,
      })
    );
  }
}

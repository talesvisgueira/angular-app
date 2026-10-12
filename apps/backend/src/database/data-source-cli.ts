import 'reflect-metadata';
import { createDataSource } from './data-source.js';

const command = process.argv[2];

if (command !== 'run' && command !== 'revert') {
  console.error('Uso: tsx -r reflect-metadata src/database/data-source-cli.ts <run|revert>');
  process.exit(1);
}

const dataSource = createDataSource();

try {
  await dataSource.initialize();
  if (command === 'run') {
    const migrations = await dataSource.runMigrations({ transaction: 'each' });
    if (migrations.length === 0) {
      console.log('Nenhuma migration pendente.');
    } else {
      for (const m of migrations) console.log(`Migration aplicada: ${m.name}`);
    }
  } else {
    await dataSource.undoLastMigration({ transaction: 'each' });
    console.log('Última migration revertida.');
  }
  await dataSource.destroy();
} catch (error) {
  console.error(`Falha na migration (${command}):`, error);
  process.exit(1);
}

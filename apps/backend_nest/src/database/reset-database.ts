import { seed } from '../libs/entities/seed';
import AppDataSource from './data-source';

async function resetDB() {
    await AppDataSource.initialize();

    // Drops all tables
    await AppDataSource.dropDatabase();

    // Recreates tables based on entities
    await AppDataSource.synchronize();

    await seed();
    
    console.log('Database reset completed!');
    process.exit(0);
}
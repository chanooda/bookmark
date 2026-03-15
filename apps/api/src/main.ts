import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { AppModule } from './app.module';
import { db } from './db';

async function bootstrap() {
	migrate(db, { migrationsFolder: join(process.cwd(), 'drizzle') });

	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
		credentials: true,
	});

	const port = process.env.PORT ?? 3000;
	await app.listen(port);
	console.log(`API running on http://localhost:${port}`);
}

bootstrap();

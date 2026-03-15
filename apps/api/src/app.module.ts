import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { FoldersModule } from './folders/folders.module';
import { MetadataModule } from './metadata/metadata.module';
import { TagsModule } from './tags/tags.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		AuthModule,
		BookmarksModule,
		FoldersModule,
		MetadataModule,
		TagsModule,
	],
})
export class AppModule {}

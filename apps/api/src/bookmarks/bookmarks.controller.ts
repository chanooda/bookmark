import type {
	BookmarkListQuery,
	CreateBookmarkDto,
	ReorderItemDto,
	UpdateBookmarkDto,
} from '@bookmark/types';
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { BookmarksService } from './bookmarks.service';

@Controller('bookmarks')
@UseGuards(AuthGuard('jwt'))
export class BookmarksController {
	constructor(private bookmarksService: BookmarksService) {}

	@Get()
	findAll(@Req() req: Request, @Query() query: BookmarkListQuery) {
		const user = req.user as { id: string };
		return this.bookmarksService.findAll(user.id, query);
	}

	@Get(':id')
	findOne(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as { id: string };
		return this.bookmarksService.findOne(user.id, id);
	}

	@Post()
	create(@Req() req: Request, @Body() dto: CreateBookmarkDto) {
		const user = req.user as { id: string };
		return this.bookmarksService.create(user.id, dto);
	}

	@Patch('reorder')
	reorder(@Req() req: Request, @Body() body: { items: ReorderItemDto[] }) {
		const user = req.user as { id: string };
		return this.bookmarksService.reorder(user.id, body.items);
	}

	@Patch(':id')
	update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateBookmarkDto) {
		const user = req.user as { id: string };
		return this.bookmarksService.update(user.id, id, dto);
	}

	@Delete(':id')
	remove(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as { id: string };
		return this.bookmarksService.remove(user.id, id);
	}
}

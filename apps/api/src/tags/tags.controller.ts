import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { CreateTagDto, UpdateTagDto } from '@repo/types';
import type { Request } from 'express';
import { TagsService } from './tags.service';

@Controller('tags')
@UseGuards(AuthGuard('jwt'))
export class TagsController {
	constructor(private tagsService: TagsService) {}

	@Get()
	findAll(@Req() req: Request) {
		const user = req.user as { id: string };
		return this.tagsService.findAll(user.id);
	}

	@Post()
	create(@Req() req: Request, @Body() dto: CreateTagDto) {
		const user = req.user as { id: string };
		return this.tagsService.create(user.id, dto);
	}

	@Patch(':id')
	update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateTagDto) {
		const user = req.user as { id: string };
		return this.tagsService.update(user.id, id, dto);
	}

	@Delete(':id')
	remove(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as { id: string };
		return this.tagsService.remove(user.id, id);
	}
}

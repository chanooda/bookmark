import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { CreateFolderDto, ReorderItemDto, UpdateFolderDto } from '@repo/types';
import type { Request } from 'express';
import { FoldersService } from './folders.service';

@Controller('folders')
@UseGuards(AuthGuard('jwt'))
export class FoldersController {
	constructor(private foldersService: FoldersService) {}

	@Get()
	findAll(@Req() req: Request) {
		const user = req.user as { id: string };
		return this.foldersService.findAll(user.id);
	}

	@Post()
	create(@Req() req: Request, @Body() dto: CreateFolderDto) {
		const user = req.user as { id: string };
		return this.foldersService.create(user.id, dto);
	}

	@Patch('reorder')
	reorder(@Req() req: Request, @Body() body: { items: ReorderItemDto[] }) {
		const user = req.user as { id: string };
		return this.foldersService.reorder(user.id, body.items);
	}

	@Patch(':id')
	update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateFolderDto) {
		const user = req.user as { id: string };
		return this.foldersService.update(user.id, id, dto);
	}

	@Delete(':id')
	remove(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as { id: string };
		return this.foldersService.remove(user.id, id);
	}
}

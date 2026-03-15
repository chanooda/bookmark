import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@Get('google')
	@UseGuards(AuthGuard('google'))
	googleAuth() {
		// Redirects to Google
	}

	@Get('google/callback')
	@UseGuards(AuthGuard('google'))
	googleCallback(@Req() req: Request, @Res() res: Response) {
		const user = req.user as { id: string };
		const token = this.authService.signToken(user.id);
		const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';
		res.redirect(`${clientUrl}/auth/callback?token=${token}`);
	}

	@Post('google/exchange')
	async googleExchange(@Body() body: { code: string; redirectUri: string }) {
		return this.authService.exchangeGoogleCode(body.code, body.redirectUri);
	}
}

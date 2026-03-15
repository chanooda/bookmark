import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';

interface GoogleProfile {
	googleId: string;
	email: string;
	name: string;
	avatar: string | null;
}

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService) {}

	async findOrCreateUser(profile: GoogleProfile) {
		const [existing] = await db.select().from(users).where(eq(users.googleId, profile.googleId));

		if (existing) return existing;

		const [created] = await db
			.insert(users)
			.values({
				id: randomUUID(),
				googleId: profile.googleId,
				email: profile.email,
				name: profile.name,
				avatar: profile.avatar,
				createdAt: new Date(),
			})
			.returning();

		return created;
	}

	signToken(userId: string) {
		return this.jwtService.sign({ sub: userId });
	}

	async exchangeGoogleCode(code: string, redirectUri: string): Promise<{ token: string }> {
		const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				code,
				client_id: process.env.GOOGLE_CLIENT_ID ?? '',
				client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
				redirect_uri: redirectUri,
				grant_type: 'authorization_code',
			}),
		});

		if (!tokenRes.ok) throw new Error('Google token exchange failed');

		const tokens = (await tokenRes.json()) as { access_token: string };

		const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: { Authorization: `Bearer ${tokens.access_token}` },
		});

		if (!userInfoRes.ok) throw new Error('Failed to fetch Google user info');

		const profile = (await userInfoRes.json()) as {
			id: string;
			email: string;
			name: string;
			picture: string | null;
		};

		const user = await this.findOrCreateUser({
			googleId: profile.id,
			email: profile.email,
			name: profile.name,
			avatar: profile.picture ?? null,
		});

		return { token: this.signToken(user.id) };
	}
}

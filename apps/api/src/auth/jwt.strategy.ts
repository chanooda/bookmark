import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { eq } from 'drizzle-orm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { db } from '../db';
import { users } from '../db/schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: process.env.JWT_SECRET ?? 'secret',
		});
	}

	async validate(payload: { sub: string }) {
		const [user] = await db.select().from(users).where(eq(users.id, payload.sub));
		if (!user) throw new UnauthorizedException();
		return user;
	}
}

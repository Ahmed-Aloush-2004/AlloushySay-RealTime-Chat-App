// src/auth/jwt.strategy.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userService: UserService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'), // Read JWT_SECRET from .env
    });
  }

  async validate(payload: any) {
    // Find the user by ID from the JWT payload
    const user = await this.userService.findOne(payload.sub);
   
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { userId: user._id, username: user.username };
  }
}  
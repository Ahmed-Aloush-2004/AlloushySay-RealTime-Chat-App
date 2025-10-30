// google.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'], // Data you request from Google
    });
    console.log('this is the GOOGLE_CLIENT_ID : ', configService.get('GOOGLE_CLIENT_ID'),);
    console.log('this is the GOOGLE_CLIENT_SECRET : ', configService.get('GOOGLE_CLIENT_SECRET'),);
    console.log('this is the GOOGLE_CALLBACK_URL : ', configService.get('GOOGLE_CALLBACK_URL'),);
    
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
    };
    // This is where you implement logic to find/create the user in your database
    // and issue a JWT token (using JwtService) for session management.
    done(null, user);
  }
}
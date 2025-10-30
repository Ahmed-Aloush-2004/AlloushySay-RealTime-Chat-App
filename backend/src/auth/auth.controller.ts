// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Request, Get, Req, Redirect } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthGuard } from '@nestjs/passport';
import { access } from 'fs';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }


  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard kicks off the Google OAuth flow
  }

  // 2. Google redirects back to this endpoint
  // @Get('google/callback')
  // @UseGuards(AuthGuard('google'))
  // googleAuthRedirect(@Req() req) {
  //   // req.user contains the user object returned by GoogleStrategy's validate method
  //   // You'll typically generate and return a JWT token here.
  //   const {firstName,lastName,email} = req.user;
  //   const username = `${firstName}-${lastName}${Math.floor(Math.random()*100)}}`;
  //   return this.authService.signupOrLoginGoogle({username,email})
  // }

  // NestJS backend: auth.controller.ts (Conceptual)
// Ensure you have: import { Controller, Get, UseGuards, Req, Redirect } from '@nestjs/common';

@Get('google/callback')
@UseGuards(AuthGuard('google'))
@Redirect() // Tells NestJS to follow the returned URL
async googleAuthRedirect(@Req() req) {
    // Assume you get the tokens and user from a service/logic after auth
    const { firstName,lastName,email} = req.user; // Simplified
    const username = `${firstName}-${lastName}${Math.floor(Math.random()*100)}}`;
    const {user,accessToken,refreshToken} = await this.authService.signupOrLoginGoogle({username, email});
    // Encode the data to be safe in a URL
    const userJson = encodeURIComponent(JSON.stringify(user));

    // Redirect the browser to your React frontend, passing tokens and user data
    return {
        url: `http://localhost:5173/auth/google/success?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${userJson}`,
        statusCode: 302
    };
}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto
  ) {
    return this.authService.login(loginDto);
  }

  @Post('refresh-token')
  async getAccessToken(
    @Body() body : { refreshToken: string }
  ) {
    return this.authService.getAccessToken(body.refreshToken);
  }
  

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }
}
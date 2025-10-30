// src/auth/auth.service.ts
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { AuthResponse } from 'src/common/interfaces/auth-response.interface';
import { TokenPayload } from 'src/common/interfaces/token-payload.interface';
import { ConfigService } from '@nestjs/config';
import { SignupOrLoginDto } from './dto/signup-or-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) { }

  async validateUser(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { username: user.username, sub: user._id.toString() };
    const accessToken = await this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(payload);
    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        avatar: user?.avatar,
        isOnline: user.isOnline
      },
    };
  }

  async signup(signupDto: SignupDto) {
    // Check if username or email already exists
    const existingUserByEmail = await this.userService.findByEmail(signupDto.email);
    const existingUserByUsername = await this.userService.findByUsername(signupDto.username);

    if (existingUserByEmail) {
      throw new BadRequestException('Email is already registered');
    }

    if (existingUserByUsername) {
      throw new BadRequestException('Username is already taken');
    }
    const user = await this.userService.create(signupDto);

    const payload = { username: user.username, sub: user._id.toString() };
    const accessToken = await this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(payload);
    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        avatar: user?.avatar,
        isOnline: user.isOnline
      },
    };
    return this.login({ email: signupDto.username, password: signupDto.password });
  }


    async signupOrLoginGoogle(signupOrLoginDto: SignupOrLoginDto) {
    // Check if username or email already exists
    let user;
     user = await this.userService.findByEmail(signupOrLoginDto.email);

    if(!user){
     user = await this.userService.create({username:signupOrLoginDto.username,email:signupOrLoginDto.email});
    }
    
    const payload = { username: user.username, sub: user._id.toString() };
    const accessToken = await this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(payload);
    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        avatar: user?.avatar,
        isOnline: user.isOnline
      },
    };
  }



  async getProfile(userId:string){
    return this.userService.findOne(userId);
  }

  async getAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const payload = { username: decoded.username, sub: decoded.sub };
      const accessToken = await this.generateAccessToken(payload);
      return { accessToken };
      
    } catch (error) {
      console.error(error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }


  async generateAccessToken(payload: TokenPayload): Promise<string> {
    // Uses the default secret and signOptions from JwtModule.registerAsync (the access token config)
    return this.jwtService.signAsync(payload);
  }

  // 🔄 Generate Refresh Token (long-lived, requires a separate secret)
  async generateRefreshToken(payload: TokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME') as any,
    });
  }

 
} 
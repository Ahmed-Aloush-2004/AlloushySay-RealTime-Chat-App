import { IsEmail, IsNotEmpty, Length, MinLength } from "class-validator";

export class SignupDto {
    @IsNotEmpty()
    @Length(3, 20)
    username: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    @MinLength(6)
    password: string;
}
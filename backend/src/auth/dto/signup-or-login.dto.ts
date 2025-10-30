import { IsEmail, IsNotEmpty, Length, MinLength } from "class-validator";

export class SignupOrLoginDto {
    @IsNotEmpty()
    @Length(3, 20)
    username: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

}
import { IsString } from "class-validator";




export class GetMessagesForUsersDto {

    @IsString()
    user1: string;

    @IsString()
    user2: string;

}

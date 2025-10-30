import { IsMongoId } from "class-validator";




export class GroupMembershipDto {

    @IsMongoId()
    groupId: string



    @IsMongoId()
    userId: string

}
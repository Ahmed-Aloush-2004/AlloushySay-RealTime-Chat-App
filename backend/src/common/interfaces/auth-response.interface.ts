import { User } from "src/user/schemas/user.schema";



export interface AuthResponse {
    user: {
        _id:string,
        username:string,
        email:string,
        avatar?:string | null,
        isOnline:boolean
    },
    accessToken: string;
    refreshToken: string;
}
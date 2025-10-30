import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types, HydratedDocument } from 'mongoose';


export type GroupDocument = HydratedDocument<Group>;

@Schema({ timestamps: true })
export class Group {

    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String })
    description?: string;

    @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
    members: Types.ObjectId[];

    @Prop({ type: [Types.ObjectId],ref: 'Message' })
    messages: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    admin: Types.ObjectId;
}


export const GroupSchema = SchemaFactory.createForClass(Group);

import mongoose, {Document, Schema} from 'mongoose';

export const UserSchema = new Schema({
    fbId: String,
    firstName: String,
    lastName: String,
    profilePic: String,
    diagnosticTest: [{
        name: String,
        report: String,
        cost: Number,
    }],
    appointments: [Schema.Types.ObjectId],
});


export interface IUserTests {
    name: string;
    report: string;
    cost: number;
}

export interface ICreateUser {
    fbId: string;
    firstName: string;
    lastName: string;
    profilePic: string;
    diagnosticTest?: [IUserTests];
    appointments?: string[];
}

export interface IUser extends Document, ICreateUser {
}

export default mongoose.model<IUser>('users', UserSchema);

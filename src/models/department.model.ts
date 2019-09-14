import mongoose, {Document, Schema} from 'mongoose';

export const DepartmentSchema = new Schema({
    name: String,
    pic: String,
    info: String,
    more: String,
    doctors: [Schema.Types.ObjectId],
    diagnosticTest: [{
        name: String,
        cost: Number,
    }],
});

export interface IDepartmentTests {
    name: string;
    cost: number;
}

export interface ICreateDepartment {
    name: string;
    pic: string;
    info: string;
    more: string;
    doctors: string[];
    diagnosticTest?: [IDepartmentTests];
}

export interface IDepartment extends Document, ICreateDepartment {
}

export default mongoose.model<IDepartment>('departments', DepartmentSchema);

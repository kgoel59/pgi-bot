import mongoose, {Document, Schema} from 'mongoose';

const DoctorSchema = new Schema({
    name: String,
    speciality: String,
    contact: String,
    designation: String,
    opdDays: [String],
});

export interface ICreateDoctor {
    name: string;
    speciality: string;
    contact: string;
    designation: string;
    opdDays: string[];
}

export interface IDoctor extends Document, ICreateDoctor {
}

export default mongoose.model<IDoctor>('doctors', DoctorSchema);

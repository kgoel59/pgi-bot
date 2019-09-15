import mongoose, {Document, Schema} from 'mongoose';

export const AppointmentSchema = new Schema({
    name: String,
    phone: Number,
    department: String,
    doctor: String,
});

export interface ICreateAppointment {
    name: string;
    phone: number;
    department?: string;
    doctor?: string;
}

export interface IAppointment extends Document, ICreateAppointment {
}

export default mongoose.model<IAppointment>('appointments', AppointmentSchema);

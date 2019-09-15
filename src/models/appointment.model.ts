import mongoose, {Document, Schema} from 'mongoose';

export const AppointmentSchema = new Schema({
    name: String,
    phone: Number,
});

export interface ICreateAppointment {
    name: string;
    phone: number;
}

export interface IAppointment extends Document, ICreateAppointment {
}

export default mongoose.model<IAppointment>('appointments', AppointmentSchema);

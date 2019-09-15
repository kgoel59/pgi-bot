import Appointment, { IAppointment, ICreateAppointment } from '../models/appointment.model';

async function CreateAppointment(name: string,
                                 phone: number): Promise<IAppointment> {

    const newAppointment: ICreateAppointment = {
        name, phone,
    };

    return Appointment.create(newAppointment)
        .then((data: IAppointment) => {
            return data;
        })
        .catch((error: Error) => {
            throw error;
        });
}


async function GetAppointment(Id: string): Promise<IAppointment> {
    return Appointment.findOne({Id})
        .then((data: IAppointment) => {
            return data;
        })
        .catch((error: Error) => {
            throw error;
        });
}

export default {
    CreateAppointment,
    GetAppointment,
};

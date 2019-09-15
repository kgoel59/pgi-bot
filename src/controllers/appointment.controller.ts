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

async function UpdateAppointment(id: string, appointment: any) {
    return Appointment.findByIdAndUpdate(id, appointment)
    .then((data) => {
        return data;
    }).catch((error) => {
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
    UpdateAppointment,
    GetAppointment,
};

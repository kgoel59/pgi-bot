import { IAppointment } from '../models/appointment.model';
import User, { ICreateUser, IUser } from '../models/user.model';

import AppointmentController from '../controllers/appointment.controller';

async function CreateUser( fbId: string,
                           firstName: string,
                           lastName: string,
                           profilePic: string): Promise<IUser> {

    const newUser: ICreateUser = {
        fbId, firstName, lastName, profilePic,
    };

    return User.create(newUser)
        .then((data: IUser) => {
            return data;
        })
        .catch((error: Error) => {
            throw error;
        });
}


async function GetUser(fbId: string): Promise<IUser> {
    return User.findOne({fbId})
        .then((data: IUser) => {
            return data;
        })
        .catch((error: Error) => {
            throw error;
        });
}

async function AddAppointment(user: IUser, name: string, phone: number): Promise<IAppointment> {
    const appointment = await AppointmentController.CreateAppointment(name, phone);
    const appointments = user.appointments;
    appointments.push(appointment._id);

    return User.findByIdAndUpdate(user._id, {appointments})
    .then(() => {
        return appointment;
    }).catch((err) => {
        throw err;
    });
}

export default {
    CreateUser,
    GetUser,
    AddAppointment,
};

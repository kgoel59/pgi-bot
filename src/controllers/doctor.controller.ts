import Doctor, { ICreateDoctor, IDoctor } from '../models/doctor.model';

async function CreateDoctor( name: string,
                             speciality: string,
                             designation: string,
                             contact: string,
                             opdDays: string[]): Promise<IDoctor> {

    const newDep: ICreateDoctor = {
        name, speciality, contact, designation, opdDays,
    };

    return Doctor.create(newDep)
        .then((data: IDoctor) => {
            return data;
        })
        .catch((error: Error) => {
            throw error;
        });
}


async function GetDoctors(): Promise<IDoctor[]> {
    return Doctor.find({})
        .then((data: IDoctor[]) => {
            return data;
        })
        .catch((error: Error) => {
            throw error;
        });
}

async function GetDoctorByID(id: string): Promise<IDoctor> {
    return Doctor.findById(id)
        .then((data: IDoctor) => {
            return data;
        })
        .catch((error: Error) => {
            throw error;
        });
}

export default {
    CreateDoctor,
    GetDoctors,
    GetDoctorByID,
};

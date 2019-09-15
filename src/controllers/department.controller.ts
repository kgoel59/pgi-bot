import Department, { ICreateDepartment, IDepartment } from '../models/department.model';
import { IDoctor } from '../models/doctor.model';

import DoctorController from './doctor.controller';

async function CreateDepartment( name: string,
                                 pic: string,
                                 info: string,
                                 more: string,
                                 doctors: string[]): Promise<IDepartment> {

    const newDep: ICreateDepartment = {
        name, pic, info, more, doctors,
    };

    return Department.create(newDep)
        .then((data: IDepartment) => {
            return data;
        })
        .catch((error: Error) => {
            throw error;
        });
}


async function GetDepartments(): Promise<IDepartment[]> {
    return Department.find({})
        .then((data: IDepartment[]) => {
            return data;
        })
        .catch((error: Error) => {
            throw error;
        });
}

async function GetDepartmentByID(id: string): Promise<IDepartment> {
    return Department.findById(id)
        .then((data: IDepartment) => {
            return data;
        })
        .catch((error: Error) => {
            throw error;
        });
}

async function GetDepDoctors(id: string): Promise<IDoctor[]> {
    const doctors: IDoctor[] = new Array();
    const department = await GetDepartmentByID(id);

    for (const doctorId of department.doctors) {
        const doctor = await DoctorController.GetDoctorByID(doctorId);
        doctors.push(doctor);
    }

    return doctors;
}

export default {
    CreateDepartment,
    GetDepartments,
    GetDepartmentByID,
    GetDepDoctors,
};

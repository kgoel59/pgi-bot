import Department, { ICreateDepartment, IDepartment } from '../models/department.model';

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

export default {
    CreateDepartment,
    GetDepartments,
    GetDepartmentByID,
};

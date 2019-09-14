import User, { ICreateUser, IUser } from '../models/user.model';

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

export default {
    CreateUser,
    GetUser,
};

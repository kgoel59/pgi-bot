import {Request, Response, Router} from 'express';
import DepartmentController from '../controllers/department.controller';


export default (router: Router) => {
    router.post('/department', async (req: Request, res: Response) => {
        const name: string = req.body.name;
        const pic: string  = req.body.pic;
        const info: string = req.body.info;
        const more: string = req.body.more;
        const doctors: string[] = req.body.doctors;

        const department = await DepartmentController.CreateDepartment(name, pic, info, more, doctors);

        return res.send(department);
    });
};

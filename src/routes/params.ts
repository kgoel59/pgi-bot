import {NextFunction, Request, Response, Router} from 'express';
import {IError} from './errorHandler';

export default (router: Router) => {

    router.param('id', (req: Request, res: Response, next: NextFunction, id: string) => {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            const err: IError = {
                status: 500,
                message: 'Server Error',
            };
            return next(err);
        }
        return next();
    });
};

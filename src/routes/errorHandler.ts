import {Application, NextFunction, Request, Response} from 'express';

export interface IError {
    status?: number;
    message?: string;
}

export default (express: Application) => {

    express.use((req: Request , res: Response, next: NextFunction) => {
        const err: IError = {
            status: 404,
            message: 'Not Found',
        };
        next(err);
    });

    express.use((err: IError, req: Request, res: Response, next: NextFunction) => {
        res.status(err.status || 500);
        res.json({
            error: {
                message: err.message,
            },
        });
    });
};

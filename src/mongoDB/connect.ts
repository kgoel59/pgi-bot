import mongoose from 'mongoose';

export default (dbHost: string, dbUser: string, dbPass: string) => {

    mongoose.connect(
        dbHost,
        {
        auth: {
            user: dbUser,
            password: dbPass,
        },
        useNewUrlParser : true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
        },
        )
        .then(() => {
            console.log(`Successfully connected to Database`);
        })
        .catch( (error) => {
            console.error('Error connecting to database: ', error);
            return process.exit(1);
        });
};

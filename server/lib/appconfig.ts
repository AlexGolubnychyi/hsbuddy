function getConfig() {
    if (process.env.NODE_ENV === 'prod') {
        return {
            secret: process.env.MY_SECRET,
            dbConnection:  process.env.DB_CONNECTION
        };
    }

    return {
        secret: 'dev secret :)',
        dbConnection: 'mongodb://admin:a12345@ds111063.mlab.com:11063/hsbuddydev'
    };
}

export const appConfig = getConfig();

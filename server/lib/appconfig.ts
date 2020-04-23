function getConfig() {
    if (process.env.NODE_ENV === 'prod') {
        return {
            secret: process.env.MY_SECRET,
            dbConnection:  process.env.DB_CONNECTION
        };
    }

    return {
        secret: 'dev secret :)',
        dbConnection: 'mongodb://localhost/hearthstonedb'
    };
}

export const appConfig = getConfig();

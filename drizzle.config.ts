
export default {
    schema: './src/db/schemas',
    out: './drizzle',
    dialect: "postgresql", 
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
}
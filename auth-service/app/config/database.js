import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'auth-db',
    database: process.env.DB_NAME || 'auth_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

export default pool; 
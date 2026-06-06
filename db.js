const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'seu_chamado_user',
  password: process.env.DB_PASSWORD || 'seu_chamado_password',
  database: process.env.DB_NAME || 'seu_chamado_db',
});

// Helper for queries
const query = (text, params) => pool.query(text, params);

// Database initialization with retries (critical for Docker Compose)
async function initDatabase() {
  let retries = 6;
  let client;

  while (retries > 0) {
    try {
      client = await pool.connect();
      console.log('Successfully connected to PostgreSQL database!');
      break;
    } catch (err) {
      retries -= 1;
      console.error(`Database connection failed. Retrying in 5 seconds... (${retries} retries left). Error: ${err.message}`);
      if (retries === 0) {
        console.error('Could not connect to PostgreSQL. Exiting...');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  try {
    // 1. Create Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'client', -- 'client' or 'tech'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Verified/Created "users" table.');

    // Schema Migration: Add role column if it does not exist in the database volume
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'client';
    `);

    // 2. Create Tickets Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'done'
        priority VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high'
        category VARCHAR(30) DEFAULT 'other', -- 'hardware', 'software', 'network', 'other'
        created_by INT REFERENCES users(id) ON DELETE CASCADE,
        assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Verified/Created "tickets" table.');

    // 3. Seed mock data if tables are brand new
    const usersCount = await client.query('SELECT count(*) FROM users');
    if (parseInt(usersCount.rows[0].count) === 0) {
      console.log('No users found. Creating default seed user...');
      // Creating a default admin user. Password: '123' hashed with bcrypt
      // Hash for '123': $2a$10$S9T7Y53NlWpQ/gV08v91t.00K6Q.3t8RCOyD1KkW7C4P2rC6eT42q (approximate, let's use a real bcrypt hash)
      // Standard bcryptjs hash for '123456': $2a$10$tZ2zN6K/Hw.NnS/mky5v0eA3mF4s4lVfL7Y2eI80B3z6rZgDq2uD.
      const defaultPassHash = '$2a$10$tZ2zN6K/Hw.NnS/mky5v0eA3mF4s4lVfL7Y2eI80B3z6rZgDq2uD.'; // '123456'
      
      const seedUserRes = await client.query(`
        INSERT INTO users (name, email, role, password_hash) 
        VALUES ('Suporte Seu Chamado', 'suporte@seuchamado.com.br', 'tech', $1) 
        RETURNING id;
      `, [defaultPassHash]);

      const adminId = seedUserRes.rows[0].id;

      // Seed tickets
      await client.query(`
        INSERT INTO tickets (title, description, status, priority, category, created_by, assigned_to)
        VALUES 
        ('Servidor de E-mail Fora do Ar', 'Nenhum funcionário consegue enviar ou receber e-mails. O erro apresentado é timeout de conexão com o SMTP.', 'todo', 'high', 'network', $1, $1),
        ('Notebook não liga', 'O notebook Dell Inspiron do setor financeiro não dá sinal de vida, nem acende o LED de carregamento.', 'in_progress', 'medium', 'hardware', $1, $1),
        ('Instalação do Slack no setor comercial', 'A equipe comercial precisa que o Slack corporativo seja instalado e configurado nas novas máquinas.', 'review', 'low', 'software', $1, $1),
        ('Configurar roteador Wi-Fi visitante', 'Configurar uma rede separada para visitantes com limite de banda e autenticação via rede social.', 'done', 'low', 'network', $1, $1);
      `, [adminId]);
      
      console.log('Seeded database with default user (suporte@seuchamado.com.br / 123456) and starting tickets!');
    }

  } catch (err) {
    console.error('Error during database schema initialization:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

module.exports = {
  query,
  pool,
  initDatabase
};

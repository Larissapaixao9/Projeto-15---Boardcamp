import pg from 'pg';
import express from 'express';
const { Pool } = pg;

const user = 'postgres';
const password = 'larissa123';
const host = 'localhost';
const port = 5432;
const database = 'meu_banco_de_dados';
const connection = new Pool({})

const query = client.query('SELECT * FROM produtos');

query.then(result => {
    console.log(result.rows);
}); 
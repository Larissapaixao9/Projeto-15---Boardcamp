import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv'
import authSchema1 from  './validations/validation_schema1.js'
dotenv.config()
//npm run devStart

const { Pool } = pg;

const connection = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

const app = express();
app.use(express.json());

app.get('/categories', (req, res) => {
  connection.query('SELECT * FROM categories').then(item => {
    res.send(item.rows);
  });
});

app.post('/categories', async(req, res) => {
    const { name } = req.body;
    const result=await authSchema1.validateAsync(req.body)
    const { Error } = result;

    if(Error){
      return res.status(400).send('error joi')
    }
    const allNames=await connection.query('SELECT categories.name FROM categories')
    //console.log(allNames.rows)
    const names = allNames.rows

    const findEqual=names.some(item=>item.name===name);
    if(findEqual){
      return res.status(409).send('esse nome já foi usado')
    }

    console.log(names)
    console.log(findEqual)
    
    connection.query('INSERT INTO categories (name) VALUES ($1)', [name]).then(() => {
      return res.sendStatus(201);
    });
  });

app.get('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.sendStatus(400);
  }

  connection.query('SELECT * FROM produtos WHERE id=$1', [id]).then(produtos => {
    const produto = produtos.rows[0];
    if (!produto) return res.sendStatus(404);
    res.send(produto);
  });
});



app.listen(4000, () => {
  console.log('Server listening on port 4000.');
});
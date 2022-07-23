import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv'
import authSchema1 from  './validations/validation_schema1.js'
import authSchema2 from  './validations/validation_schema2.js'

dotenv.config()
//npm run devStart

// {
//   "name":"danca",
//   "image":"https://st.depositphotos.com/1016680/3591/i/450/depositphotos_35919473-stock-photo-checkers.jpg",
//   "stockTotal":100,
//   "categoryId":3,
//   "pricePerDay":679
// }



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





/////////////////////////////////////////////////////////////////////////////////
          //ROTAS GAMES
  app.get('/games', (req, res) => {
    console.log(req.query.name)
    const queryName=req.query.name
    if(!queryName){
    connection.query('SELECT games.*, categories.name as "categoryName" FROM games JOIN categories ON games."categoryId"=categories.id').then(item => {
           res.send(item.rows);
            });
          }
        //Trabalhando com query String:
        //connection.query("SELECT games.* FROM games WHERE name LIKE '${queryName}%'")
          if(queryName){
            connection.query(`SELECT games.*, categories.name as "categoryName" FROM games JOIN categories ON games."categoryId"=categories.id WHERE LOWER (games.name) LIKE LOWER ($1)`,[`${queryName}%`]).then(item=>{
              res.send(item.rows)
            })
          }
          });

          app.post('/games', async(req, res) => {
            const { name, categoryId } = req.body;
            const newGame=req.body
            const result=await authSchema2.validateAsync(req.body)
            const { Error } = result;
        
            if(Error){
              return res.status(400).send('error joi')
            }
            const allNames=await connection.query('SELECT games.name FROM games')
            const allCategories=await connection.query('SELECT categories.id FROM categories')
            const names=allNames.rows
            const allIds = allCategories.rows
            console.log(allIds)
        
            const findNameEqual=names.some(item=>item.name===name);
            if(findNameEqual){
              return res.status(409).send('esse nome de jogo já foi usado')
            }
            const isId=allIds.some(item=>item.id===categoryId)
            if(!isId){
              return res.status(400).send('esse id de categoria não existe')
            }
            console.log(names)
            console.log(findNameEqual)
            
            connection.query(`INSERT INTO games (name,image,"stockTotal","categoryId","pricePerDay") VALUES ('${newGame.name}','${newGame.image}',${newGame.stockTotal}, ${newGame.categoryId},${newGame.pricePerDay})`).then(() => {
              return res.sendStatus(201);
            });
          });



          
  ////////////////////////////////////////////////////////////////////////
                      //ROTAS CUSTOMERS
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
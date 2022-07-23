import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv'
import authSchema1 from  './validations/validation_schema1.js'
import authSchema2 from  './validations/validation_schema2.js'
import authSchemaCustomer from './validations/validation_schema_customers.js'

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
    const { error } = result;

    if(error){
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
    app.get('/customers', (req, res) => {
        const queryStringParameter = req.query.cpf
        console.log(queryStringParameter)
        if(queryStringParameter){
          connection.query(`SELECT customers.* FROM customers WHERE customers.cpf LIKE ($1)`,[`${queryStringParameter}%`]).then(item=>{
            return res.send(item.rows)
          })
        }
       else{
        connection.query('SELECT * FROM customers').then(item => {
          return res.send(item.rows);
          });
       }

    });
  
  
app.get('/customers/:id', async(req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.sendStatus(400);
  }

  const allCustomersId=await connection.query('SELECT customers.id FROM customers')
  const ids=allCustomersId.rows
  console.log(allCustomersId.rows)
  const find_customer_ID = ids.some(x=>x.id===id);
  if(!find_customer_ID){
    return res.status(404).send('Numero do ID do cliente não existe')
  }

  connection.query('SELECT * FROM customers WHERE id=$1', [id]).then(customers => {
    const item = customers.rows[0];
    if (!item) return res.sendStatus(404);
    res.send(item);
  });
});

app.post('/customers', async(req, res) => {

  const { name, phone, cpf, birthday } = req.body
  const result=await authSchemaCustomer.validateAsync(req.body)
  console.log(result.error)
  const allcpf=await connection.query('SELECT customers.cpf FROM customers')
  
  const cpfs = allcpf.rows

  const findEqual=cpfs.some(item=>item.cpf===cpf);
  if(findEqual){
    return res.status(409).send('esse cpf já foi usado')
  }

  console.log(cpfs)
  console.log(findEqual)
  
  connection.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)', [name, phone, cpf, birthday]).then(() => {
    return res.sendStatus(201);
  });
});

app.put('/customers/:id',async(req,res)=>{
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.sendStatus(400);
  }

  const { name, phone, cpf, birthday } = req.body;

  const allcpf=await connection.query('SELECT customers.cpf FROM customers')
  
  const cpfs = allcpf.rows

  const findEqual=cpfs.some(item=>item.cpf===cpf);
  if(findEqual){
    return res.status(409).send('esse cpf já foi usado')
  }
  connection.query('UPDATE customers SET name=$1, phone=$2, cpf=$3, birthday=$4  WHERE id=$5',[name,phone, cpf,birthday,id]).then(()=>{
    return res.sendStatus(200)
  })
})














app.listen(4000, () => {
  console.log('Server listening on port 4000.');
});
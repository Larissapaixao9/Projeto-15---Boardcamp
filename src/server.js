import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv'
import joi from 'joi'
import cors from 'cors'
import moment from 'moment';
import authSchema1 from  './validations/validation_schema1.js'
import authSchema2 from  './validations/validation_schema2.js'
import authSchemaCustomer from './validations/validation_schema_customers.js'
import formateDateFunction from './dateAdjust/formateDateFunction.js'

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
app.use(cors())

app.get('/categories', (req, res) => {
  connection.query('SELECT * FROM categories').then(item => {
    res.send(item.rows);
  });
});

app.post('/categories', async(req, res) => {
    const { name } = req.body;
    const categorySchema = joi.object({
      name: joi.string().required().trim()
    });
  
    const { error } = categorySchema.validate(req.body);
  
    if (error) {
      return res.sendStatus(400);
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
            const gameSchema = joi.object({
              name: joi.string().required().trim(),
              stockTotal:joi.number().min(1),
              image:joi.required(),
              categoryId:joi.required(),
              pricePerDay:joi.number().min(1)
            });
          
            const { error } = gameSchema.validate(req.body);
          
            if (error) {
              return res.sendStatus(400);
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
  console.log(phone)
  const customerSchema = joi.object({
    name:joi.string().required().trim(),
    cpf:joi.string().length(11),
    birthday: joi.date().iso(),
    phone:joi.string()
  });
  if(phone.length<10){
    return res.status(400).send('numero de telefone é menor que 10')
  }
  if(phone.length>11){
    return res.status(400).send('numero de telefone é maior que 11')
  }
  const { error } = customerSchema.validate(req.body);

  if (error) {
    
    return res.status(400).send(error);
  }


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

  const customerSchema = joi.object({
    name:joi.string().required().trim(),
    cpf:joi.string().length(11),
    birthday: joi.date().iso(),
    phone:joi.string()
  });
  if(phone.length<10){
    return res.status(400).send('numero de telefone é menor que 10')
  }
  if(phone.length>11){
    return res.status(400).send('numero de telefone é maior que 11')
  }
  const { error } = customerSchema.validate(req.body);

  if (error) {
    
    return res.status(400).send(error);
  }
  
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
/////////////////////////////////////////////////////////
            //ROTA rentals

app.post('/rentals',async (req,res)=>{
  const { customerId, gameId, daysRented } = req.body;
  let originalPrice
  let count=0;
  const rentDate = moment().format('YYYY-MM-DD')
  console.log(rentDate)

  if(daysRented<=0){
    return res.status(400).send('Dias devem ser maior que zero')
  }

  const gamesIds = await connection.query('SELECT games.id FROM games')
  const getAllGames = await connection.query(`SELECT * FROM games WHERE id=$1`,[gameId])
  const allGamesIds = gamesIds.rows
  const findEqualGameId=allGamesIds.some(item=>item.id===gameId);
  if(!findEqualGameId){
      return res.status(400).send('esse id de jogo não existe')
  }

  const costumersIds=await connection.query('SELECT customers.id FROM customers')
  const allCustomers_Id = costumersIds.rows
  const findEqualCostumersId = allCustomers_Id.some(item=>item.id===customerId);
  if(!findEqualCostumersId){
      return res.status(400).send('esse id de usuario ainda nao existe')
  }

  const rents=await connection.query(`SELECT * FROM rentals WHERE "gameId"=$1`,[gameId])
  const allRents=rents.rows;
  for(let i=0;i<allRents.length;i++){
    if(allRents[i].returnDate !=null){
      count++
    }
  }
  if(getAllGames.rows.length===0){
    return res.status(400).send('erro ao adicionar game')
  }
  else if(getAllGames.rows[0].stockTotal<=(allRents.length-count)){
    return res.status(400).send('tem alugueis em aberto acima da quantidade de jogos em estoque')
  }
  
  const price=await connection.query(`SELECT "pricePerDay" FROM games WHERE id=$1`,[gameId])
  
  let realPrice=price.rows
  console.log(realPrice)
  const findPrice=realPrice.find(item=>item.pricePerDay)
  console.log(findPrice.pricePerDay)
  originalPrice = findPrice.pricePerDay*daysRented
  console.log(originalPrice)

  //CALCULO DA DIFERENÇA ENTRE DATAS
  let idealDatetoReturn=new Date(rentDate)
  idealDatetoReturn.setDate(idealDatetoReturn.getDate()+daysRented)
  console.log(idealDatetoReturn)
  idealDatetoReturn=moment().format('YYYY-MM-DD')

  connection.query(`INSERT INTO rentals ("customerId","gameId","rentDate","daysRented","returnDate","originalPrice","delayFee") VALUES ('${customerId}','${gameId}','${rentDate}','${daysRented}',${null},'${originalPrice}',${null})`).then(() => {
    return res.sendStatus(201);
  });
})

app.get('/rentals',async(req,res)=>{
  const custumerIdFromQuery =  req.query.customerId;
  const gameIdFromQuery = req.query.gameId;
  console.log(custumerIdFromQuery)
  
  let array=[]
  let filteredArray=[]

  const originalRentalsData = await connection.query(`SELECT rentals.*, customers.id AS customer_ids,customers.name as custumres_names, games.id as games_ids, games.name as games_names,categories.id as category_ids, categories.name as category_names  FROM rentals JOIN customers ON rentals."customerId"=customers.id JOIN games ON rentals."gameId"=games.id JOIN categories ON games."categoryId"=categories.id`)

  if(custumerIdFromQuery || gameIdFromQuery){
    for(let i=0;i<originalRentalsData.rows.length;i++){
      if(originalRentalsData.rows[i].customer_ids==custumerIdFromQuery || originalRentalsData.rows[i].games_ids ==gameIdFromQuery){
        filteredArray.push({
          id:originalRentalsData.rows[i].id,
          customerId:originalRentalsData.rows[i].customerId,
          gameId:originalRentalsData.rows[i].gameId,
          rentDate:originalRentalsData.rows[i].rentDate,
          daysRented:originalRentalsData.rows[i].daysRented,
          returnDate:originalRentalsData.rows[i].returnDate,
          originalPrice:originalRentalsData.rows[i].originalPrice,
          delayFee:originalRentalsData.rows[i].delayFee,
          customer:{
            id:originalRentalsData.rows[i].customer_ids,
            name:originalRentalsData.rows[i].custumres_names
          },
          game:{
            id:originalRentalsData.rows[i].games_ids,
            name:originalRentalsData.rows[i].games_names,
            categoryId:originalRentalsData.rows[i].category_ids,
            categoryName:originalRentalsData.rows[i].category_names
          }
        })
      }
    }

   return res.status(200).send(filteredArray)
  }

  else{
    for(let i=0;i<originalRentalsData.rows.length;i++){
      array.push({
        id:originalRentalsData.rows[i].id,
        customerId:originalRentalsData.rows[i].customerId,
        gameId:originalRentalsData.rows[i].gameId,
        rentDate:originalRentalsData.rows[i].rentDate,
        daysRented:originalRentalsData.rows[i].daysRented,
        returnDate:originalRentalsData.rows[i].returnDate,
        originalPrice:originalRentalsData.rows[i].originalPrice,
        delayFee:originalRentalsData.rows[i].delayFee,
        customer:{
          id:originalRentalsData.rows[i].customer_ids,
          name:originalRentalsData.rows[i].custumres_names,
        },
        game:{
          id:originalRentalsData.rows[i].games_ids,
          name:originalRentalsData.rows[i].games_names,
          categoryId:originalRentalsData.rows[i].category_ids,
          categoryName:originalRentalsData.rows[i].category_names
        }
      })
    }
  
    return res.send(array)
  }
 

})

app.post("/rentals/:id/return",async(req,res)=>{

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.sendStatus(400);
  }

  let date = moment().format('YYYY-MM-DD');
  let rightNow=new Date()


  const RentIds = await connection.query(`SELECT * FROM rentals WHERE id=$1`,[id])
  if(RentIds.rows.length==0){
    return res.status(404).send('id de rentals invalido')
  }
  if(RentIds.rows[0].returnDate !=null){
    return res.status(400).send('esse aluguel ja foi finalizado')
  }

  let differenceBetweenTime = Math.abs(RentIds.rows[0].rentDate.getTime()-rightNow.getTime())
  let differenceBetweenDays = differenceBetweenTime/(1000*60*60*24)
 
  const games = connection.query(`SELECT * FROM games WHERE id=$1`,[RentIds.rows[0].gameId])
  let payTaxes=0;
  if(differenceBetweenDays>RentIds.rows[0].daysRented){
    payTaxes=(differenceBetweenDays-RentIds.rows[0].daysRented)*(games.rows[0].pricePerDay)
  }

  await connection.query(`UPDATE rentals SET "returnDate"=$1, "delayFee"=$2 WHERE id=$3`,[`${date}`,payTaxes,id])
  return res.sendStatus(200)

})

app.delete("/rentals/:id",async(req,res)=>{
  const id = parseInt(req.params.id)
  if (isNaN(id)) {
    return res.sendStatus(400);
  }
  const RentIds = await connection.query(`SELECT rentals.id FROM rentals WHERE id=$1`,[id])
  if(RentIds.rows.length===0){
    return res.status(404).send('esse id de Rentals não existe')
  }
  const Rents=await connection.query(`SELECT rentals."returnDate" FROM rentals WHERE id=$1`,[id])

  const allRents = Rents.rows[0];
  console.log(allRents.returnDate)

  if(allRents.returnDate==null){
    return res.status(400).send('Rental ainda não foi finalizado, logo, não pode ser deletado')
  }
  await connection.query(`DELETE FROM rentals WHERE id=$1`,[id])
  return res.sendStatus(200)
})








app.listen(4000, () => {
  console.log('Server listening on port 4000.');
});
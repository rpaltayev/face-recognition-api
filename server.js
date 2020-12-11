const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const register = require('./controllers/register');
const signin = require('./controllers/signin');
const profile = require('./controllers/profile');
const image = require('./controllers/image');
const identify = require('./controllers/identify');

const db = knex({
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    }
});

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res)=> { res.send(db.users) });
app.get('/profile/:id', profile.handleProfileGet(db));
app.post('/register', register.handleRegister(db, bcrypt));
app.post('/signin', signin.handleSignin(db, bcrypt));
app.put('/image', (req, res) => {image.handleImage(req, res, db)});
app.post('/imageurl', (req, res) => {image.handleApiCall(req, res)});
app.post('/identify', (req, res) => {identify.handleIdentify(req, res)});
app.post('/persons', (req, res) => {identify.handleAddPerson(req, res)});
app.post('/faces', (req, res) => identify.handleAddFaces(req, res));

app.listen(process.env.PORT || 3000, ()=>{
    console.log(`app is running on port ${process.env.PORT}`);
});


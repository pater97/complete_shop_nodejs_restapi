//importo validazione,hash password e il generatore di token
const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
//importo modello user
const User = require('../models/user');
//rotta per registrarsi
exports.signup = (req, res, next) => {
  //controllo evenutali errori di validazione
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed.');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  //recupero i dati dal frontedn
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  //hasho la password
  bcrypt
    .hash(password, 12)
    .then(hashedPw => {
        //creo il costrutto per il nuovo utente
      const user = new User({
        email: email,
        password: hashedPw,
        name: name
      });
      //salvo l'utente
      return user.save();
    })
    //invio i dati al frontend
    .then(result => {
      res.status(201).json({ message: 'User created!', userId: result._id });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
//middlewar login
exports.login = (req, res, next) => {
    //estraggo dal frontend i dati
  const email = req.body.email;
  const password = req.body.password;
    //variabile necessaria al salvataggio temporaneo dell'utente
  let loadedUser;
  //cerco l'utente con quella mail
  User.findOne({ email: email })
    .then(user => {
        //se non esiste invio l'errore
      if (!user) {
        const error = new Error('A user with this email could not be found.');
        error.statusCode = 401;
        throw error;
      }
      //altrimenti inserisco nella variabile l'utente trovato
      loadedUser = user;
      //contorllo che le password corrispondano
      return bcrypt.compare(password, user.password);
    })
    .then(isEqual => {
      if (!isEqual) {
        const error = new Error('Wrong password!');
        error.statusCode = 401;
        throw error;
      }
      //se corrispondono provvedo a creare il token passandogli email e password e la chiave privata
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString()
        },
        'somesupersecretsecret',        //chiave privata
        { expiresIn: '1h' }             //scadenza del token
      );
      //invio al frontend token e l'id dell'utente
      res.status(200).json({ token: token, userId: loadedUser._id.toString() });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

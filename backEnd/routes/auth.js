//importo express e il validatore
const express = require('express');
const { body } = require('express-validator/check');
//importo modello user e controller
const User = require('../models/user');
const authController = require('../controllers/auth');
//configuro routing
const router = express.Router();
//rotta registrazione 
router.put(
  '/signup',
  [
      //validazione mail
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      //controllo che l'email non sia già stata presa
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject('E-Mail address already exists!');
          }
        });
      })
      .normalizeEmail(),
    body('password')
      .trim()
      .isLength({ min: 5 }),
    body('name')
      .trim()
      .not()
      .isEmpty()
  ],
  authController.signup
);
//rotta login
router.post('/login', authController.login);
//esporto
module.exports = router;

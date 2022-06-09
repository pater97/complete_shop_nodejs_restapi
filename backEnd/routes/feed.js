//importo express e il validatore
const express = require('express');
const { body } = require('express-validator/check');
//importo il controller
const feedController = require('../controllers/feed');
//importo il middleware di verifica del token 
const isAuth = require('../middleware/is-auth');
//creo il routing
const router = express.Router();

//rotta che fornisce i post
router.get('/posts',isAuth, feedController.getPosts);

//crea il post con validazioni
router.post(
  '/post',
  isAuth,
  [
    body('title')
      .trim()
      .isLength({ min: 5 }),
    body('content')
      .trim()
      .isLength({ min: 5 })
  ],
  feedController.createPost
);
//rotta per la vista show, il nome del parametro deve corrispondere nel controller perl'estrazione
router.get('/post/:postId', isAuth,feedController.getPost);
//rotta per l'editing con validazioni
router.put(
  '/post/:postId',
  isAuth
  ,
  [
    body('title')
      .trim()
      .isLength({ min: 5 }),
    body('content')
      .trim()
      .isLength({ min: 5 })
  ],
  feedController.updatePost
);

//rotta per l'eliminazione
router.delete('/post/:postId',isAuth, feedController.deletePost);

module.exports = router;

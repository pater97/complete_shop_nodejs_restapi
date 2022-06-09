//importo filesystem e path
const fs = require('fs');
const path = require('path');
//importo il validatore
const { validationResult } = require('express-validator/check');
//importo il modello post
const Post = require('../models/post');
//importo modello user
const User = require('../models/user');
//forisco i post
exports.getPosts = (req, res, next) => {
  //paginazione ->
  //  dal frontend recupero il numero di pagina dall'url
  const currentPage = req.query.page || 1;
  //definisco quanti post voglio vedere per pagina
  const perPage = 2;
  //creo una variabile che conterrà la quantità totale di post che mi servirà per definire il num. max di page
  let totalItems;
  //conto quanti post ho
  Post.find().countDocuments()
  .then( count => {
    //assegno il conteggio alla variabile
    totalItems = count;
    return Post.find()
      .skip((currentPage -1) * perPage)
      .limit(perPage)
  })
  .then(posts => {
      //in risposta passo lo stato e i post
      res
        .status(200)
        .json({ message: 'Fetched posts successfully.', posts: posts, totalItems:totalItems });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
//creare il post
exports.createPost = (req, res, next) => {
  //eseguo la validazione e restituisco gli errori in caso ci fossero
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    throw error;
  }
  //estrapolo dalla richiesta i dati
  // const imageUrl = req.file.path;  -> se non funziona su windows utilizzare quello sotto
  const imageUrl =req.file.path.replace("\\" ,"/");
  const title = req.body.title;
  const content = req.body.content;
  //variabile in cui salverò l'utente che crea il post
  let creator;
  //creo il costrutto per il nuovo post
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    //estrapolo dalla richiesta grazie al middleware is-auth l'utente
    creator: req.userId
  });
  //salvo il post
  post
  .save()
  .then(result => {
    //trovo l'utente in base all'id dato dalla richiesta
    return User.findById(req.userId);
  })
  .then(user => {
    //inserisco nella variabile l'utente
    creator = user;
    //aggiungo all'array post dell'utente il post in questione
    user.posts.push(post);
    //salvo le modifiche
    return user.save();
  })
  .then(result => {
    //invio al frontend il tutto
    res.status(201).json({
      message: 'Post created successfully!',
      post: post,
      creator: { _id: creator._id, name: creator.name }
    });
  })
  .catch(err => {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  });
};
//vista show
exports.getPost = (req, res, next) => {
  //recupero l'id dall'url
  const postId = req.params.postId;
  //cerco il post attraverso l'id
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      //invio il post trovato
      res.status(200).json({ message: 'Post fetched.', post: post });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
//edit del post esistente
exports.updatePost = (req, res, next) => {
  //estraggo i dati dalla richiesta
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    // imageUrl = req.file.path;  ->non funziona su windows, opzione sotto
    imageUrl = req.file.path.replace("\\","/");
  }
  if (!imageUrl) {
    const error = new Error('No file picked.');
    error.statusCode = 422;
    throw error;
  }
  //trovo il post a cui mi rifersico
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      //verfico che l'utente che fa richiesta di editing si alo stesso che ha creato il post
      if (post.creator.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.statusCode = 403;
        throw error;
      }
      //elimino il file nel caso l'immagine sia diversa da quella precedente
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }
      //assegno i nuovi valori e salvo
      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save();
    })
    .then(result => {
      res.status(200).json({ message: 'Post updated!', post: result });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost = (req,res,next) => {
  //estraggo dal'url l'id 
  const postId = req.params.postId;
  //cerco il post con l'id estratto
  Post.findById(postId)
  .then(post => {
    //se non esiste do l'errore
    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }
    //verfico che l'utente che fa richiesta di editing si alo stesso che ha creato il post
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized!');
      error.statusCode = 403;
      throw error;
    }
    //elmino il file dal filesystem
    clearImage(post.imageUrl);
    //elimino il post dal db
    return Post.findByIdAndRemove(postId);
  })
  //elimino a catena i post anche dall'utente
  .then(result => {
    return User.findById(req.userId);
  })
  .then(user => {
    user.posts.pull(postId);
    return user.save();
  })
  .then(result => {
    console.log(result);
    res.status(200).json({
      message:'post deleted'
    });
  })
  .catch( err => {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  });
}

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};

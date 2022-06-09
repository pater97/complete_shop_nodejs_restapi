//importo le varie dipendeze
const path = require('path');
//importo tool per dare il nome alle immagini
const { v4:uuidv4 } = require('uuid')
//importo dipendenze
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
//importo le rotte
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
//configuro express
const app = express();
//indico il filestorage delle immagini
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    // cb(null, new Date().toISOString() + '-' + file.originalname); -> non funziona su windows
    cb(null, uuidv4())
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // cb(null, file.fieldname + '-' + uniqueSuffix)
  }
});
//validazione del tipo di immagine
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
//indico come leggere le richieste
app.use(bodyParser.json()); // application/json
//configuro multer
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
//percorso statico per servire le immagini
app.use('/images', express.static(path.join(__dirname, 'images')));
//middleware che mi permette di utilizzare l'api in altri server
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
//utilizzo le rotte
app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);
//middleware per la gestione degli errori
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message: message });
});
//connetto il db
mongoose
  .connect(
    'mongodb+srv://root:root@thecluster.1uaxy.mongodb.net/apirest?retryWrites=true&w=majority'
  )
  .then(result => {
    app.listen(8080);
    console.log('connesso!')
  })
  .catch(err => console.log(err));

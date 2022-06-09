//importo mongoose e configuro la funzione schema 
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//creo costrutto
const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    //collego l'utente
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  //questa funzione inserisce in automatico la data
  { timestamps: true }
);
//esporto
module.exports = mongoose.model('Post', postSchema);

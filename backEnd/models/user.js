//importo mongoose e configuro la funzione schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//creo costrutto
const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'I am new!'
  },
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Post'
    }
  ]
});
//esporto
module.exports = mongoose.model('User', userSchema);

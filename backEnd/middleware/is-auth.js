//importo jsonwebtoken
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    //recupero dall'headers del frontend l'authorization
  const authHeader = req.get('Authorization');
  //se non c'è blocco tutto e do errore di autenticazione
  if (!authHeader) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  //estraggo il token dividendolo da 'bearer'
  const token = authHeader.split(' ')[1];
  let decodedToken;
  //verifico se il token corrisponde
  try {
    decodedToken = jwt.verify(token, 'somesupersecretsecret');      //verifico il token grazie a quello estrapolato e alla mia prvate key
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  //se il token non risulta uguale errore e blocco
  if (!decodedToken) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  //imposto come richiesta l'id 
  req.userId = decodedToken.userId;
  next();
};

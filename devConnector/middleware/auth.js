const jwt = require ('jsonWebToken');
const config = require ('config');

module.exports = function(req, res, next) {
    
    // GET TOKEN from header: 
    const token = req.header ('x-auth-token');

    // IF THERE IS NO TOKEN,
    if (!token) {
        return res.status (401).json( // 401 error: not authorized
            {msg: 'no token, authorization denied'}
        );
    }

    // IF THERE IS TOKEN, VERIFY IT.
    try{
        //decode token by jwt verifier
        const decoded = jwt.verify(token, config.get('jwtSecret')); 
        req.user = decoded.user;
        next();
    }catch (err){
        res.status (401).json( // 401 error: not authorized
            {msg: 'token is not valid'}
        );
    }

}
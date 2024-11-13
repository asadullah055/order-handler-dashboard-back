const jwt = require("jsonwebtoken");

const createJsonwebtoken = (payload, secretKey, expiresIn) => {
   
    
    if(typeof payload !== 'object' || !payload){
        throw new Error('Payload must be a non-empty object')
    }
    if(typeof secretKey !== 'string' || secretKey === ''){
        throw new Error('SecretKey must be a non-empty String')
    }
    try {
        const token = jwt.sign(payload, secretKey, { expiresIn });
        return token; 
    } catch (error) {
        console.error('Failed to sign in the JWT: ', error)
    }
  
};

module.exports = createJsonwebtoken;
const express = require ('express');
const router = express.Router();
const gravatar = require ('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonWebToken');
const config = require('config');
// checking required validation for models.
const {check, validationResult} = require ('express-validator'); 
const User = require ('../../models/User');

// @route Post api/users
// @desc Register user
// @access Public

// Post request need : server.js : Init Middleware
// app.use(express.json(
//     {extended: false}
//     ));

router.post ('/', 

[
    check ('name', 'Name is required').not().isEmpty(), // name must be given
    check ('email', 'Email is not valid').isEmail(), // email must be in correct format
    check ('password', 'please enter a password with 6 or more characters').isLength({min: 6}) // length must be at least 6
],

async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){ // if there is error
        return res.status(400).json({
            errors: errors.array ()
        });
    }
    
    const {name, email, password} = req.body;
    
    try {
        
        // 1 - SEE IF THE USER EXISTS: ------------
        let user = await User.findOne({ email });
        if (user){
            return res.status(400).json ({
                errors: [{msg: 'User or email already exists'}]
            });
        }
        //---------------------------------------
        
        // 2 -GET USER GRAVATAR: ----------------
        const avatar = gravatar.url (email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        });
        // creating a new instant of a user (not saved yet)
        user = new User ({
            name,
            email,
            avatar,
            password
        });
        //---------------------------------------
        
        // 3- ENCRYPT USER PASSWORD: -----------
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash (password, salt);
        await user.save();
        //---------------------------------------
        
        // 4 - RETURN JSONWEBTOKEN---------------
        const payload = {
            user: {
                id: user.id
            }
        }
        
        jwt.sign (
            payload,
            config.get('jwtSecret'),
            {expiresIn: 360000},
            (err, token) => {
                if (err) {throw err;}else{res.json({token});}
            }
            );
        //---------------------------------------       

    }catch (err){
        console.error (err.message);
        res.status(500).send ('Server error');
    }    
    // console.log (req.body);  
});

module.exports = router;
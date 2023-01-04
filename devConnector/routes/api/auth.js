const express = require ('express');
const router = express.Router();
const auth = require ('../../middleware/auth');
const bcrypt = require('bcryptjs');
const User = require ('../../models/User');
const jwt = require('jsonWebToken');
const config = require('config');
// checking required validation for models.
const {check, validationResult} = require ('express-validator'); 


//-------------------------------------------------------------------------
// @route Get api/auth
// @desc Test route
// @access Public

// router.get ('/', auth, (req, res) => res.send('Auth route'));
router.get ('/', auth, async (req, res) => { 
    // if token authorized, request user by id from User db excluded its password
    try{
        const user = await User.findById(req.user.id).select('-password'); 
        res.json (user); //respone back found user json format
    }catch (err){
        console.error (err.message);
        res.status(500).send ('Server Error');
    }
});


//-------------------------------------------------------------------------
// @route Post api/auth
// @desc Authenticate User + get token
// @access Public

router.post ('/', 

[
    check ('email', 'Email is not valid').isEmail(), // email must be in correct format
    check ('password', 'Password is required').exists() // must have password
],

async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){ // if there is error
        return res.status(400).json({
            errors: errors.array ()
        });
    }
    
    const {email, password} = req.body;
    
    try {      
        // 1 - SEE IF THE USER NOT EXISTS: ------------
        let user = await User.findOne({ email });

        if (!user){ // If no matched users in database/ return error
            return res.status(400).json ({
                errors: [{msg: 'Invalid Credential (Email)'}]
            });
        }
        // if there is user, check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch){
            return res.status(400).json ({
                errors: [{msg: 'Invalid Credential (Pass)'}]
            });
        }
        //---------------------------------------
        
        // 2 - RETURN JSONWEBTOKEN---------------
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

// 1st para: API route, res return message when reached

module.exports = router;
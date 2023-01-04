const express = require ('express');
const router = express.Router();
const auth = require ('../../middleware/auth');
const User = require ('../../models/User');

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

// 1st para: API route, res return message when reached

module.exports = router;
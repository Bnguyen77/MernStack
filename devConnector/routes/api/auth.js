const express = require ('express');
const router = express.Router();

// @route Get api/auth
// @desc Test route
// @access Public

router.get ('/', (req, res) => res.send('Auth route'));

// 1st para: API route, res return message when reached

module.exports = router;
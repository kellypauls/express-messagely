const express = require('express');
const router = new express.Router();
const ExpressError = require('../expressError');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const {SECRET_KEY} = require('../config');


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async function(req, res, next){
    try{
        const {username, password} = req.body
        if (!username || !password){
            throw new ExpressError('Invalid credentials', 400)
        }
        const result = await User.authenticate(username, password)
        if (!result){
            throw new ExpressError("Invalid credentials", 400)
        }
        User.updateLoginTimestamp(username)
        const token = jwt.sign({username}, SECRET_KEY);
        return res.json({token});
    } catch(err){
        return next(err)
    }
})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async function(req, res, next){
    try{
        const { username, password, first_name, last_name, phone } = req.body
        if (!username || !password || !first_name || !last_name || !phone){
            throw new ExpressError('All parameters are required', 400)
        }
        const user = await User.register({username, password, first_name, last_name, phone})
        if (!user.username){
            throw new ExpressError('Registration failed', 400)
        }
        const payload = {username: user.username}
        const token = jwt.sogn(payload, SECRET_KEY);
        return res.json({token})
    } catch(err){
        return next(err)
    }
})

module.exports = router

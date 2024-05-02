const express = require('express');
const router = new express.Router();
const ExpressError = require('../expressError');
const User = require('../models/user');
const jwt = require("jsonwebtoken");
const {SECRET_KEY, DB_URI} = require('../config');
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get('/', ensureLoggedIn, async function(req, res, next){
    try{
        const users = await User.all()
        return res.json({users})
    }catch(e){
        return next(e)
    }
})



/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

 router.get('/:username', ensureCorrectUser, async function(req, res, next){
     try{
        const username = req.params.username
        const user = await User.get(username)
        return res.json({user})
     }catch(e){
         return next(e)
     }
 })


/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get('/:username/to', ensureCorrectUser, async function(req, res, next){
    try{
        const username = req.params.username
        const to = await User.messagesTo(username)
        return res.json({to})
    }catch(e){
        return next(e)
    }
})


/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/from', ensureCorrectUser, async function(req, res, next){
    try{
        const username = req.params.username
        const from = await User.messagesFrom(username)
        return res.json({from})
    }catch(e){
        return next(e)
    }
})


module.exports = router
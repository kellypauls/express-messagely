const express = require('express');
const router = new express.Router();
const ExpressError = require('../expressError');
const User = require('../models/user');
const jwt = require("jsonwebtoken");
const {SECRET_KEY, DB_URI} = require('../config');
const Message = require('../models/message');
const { authenticateJWT, ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth')

router.use(authenticateJWT);

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', async function(req, res, next){
    try{
        const id = req.params.id
        const msg = await Message.get(id)
        if (msg.from_user === req.user || msg.to_user === req.user){
            return res.json({msg})
        } else {
            throw new ExpressError('Can only read your own messages')
        }
    } catch(err) {
        return next(err)
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, async function(req, res, next){
    try{
        const {to_username, body} = req.body
        const from_username = req.user.to_username
        const msg = await Message.create({from_username, to_username, body})
        return res.json(msg)
    } catch(err){
        return next(err)
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', async function(req, res, next){
    try{
        const id = req.params.id
        const msg = await Message.get(id)
        if (msg.to_user !== req.user.username){
            throw new ExpressError('Only intended recipient can mark message as read')
        }
        const read = await Message.markRead(id)
        return res.json(read)
    } catch(err){
        return next(err)
    }
})

module.exports = router

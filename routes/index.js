const express = require('express')
const router = express.Router()
// Helpers
const {
    userFieldsValidator,
    asyncHandler,
    authenticateUser,
} = require('../helper');

// Authentication modules
const bcryptjs = require('bcryptjs')
const {
    validationResult
} = require('express-validator')

// Get references to our models.
const db = require("../models");
const User = db.users;
const Post = db.posts;

// *Authenticated Route that returns the current authenticated user.
router.get('/users', authenticateUser, (req, res) => {

    const user = req.currentUser
    res.json({
        user
    });

});

// Route that creates a new user using Validation middleware
router.post('/users', userFieldsValidator, asyncHandler( async (req, res) => {
    // Attempt to get the validation result from the Request object.
    const errors = validationResult(req);

    // If there are validation errors.
    if (!errors.isEmpty()) {
        // get a list of error messages.
        const errorMessages = errors.array().map(error => error.msg);
        // Return the validation errors to the client.
        return res.status(400).json({
            errors: errorMessages
        });
    }
    // Get the user from the request body.
    const user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        emailAddress: req.body.emailAddress,
        password: req.body.password
    });
    // Hash the new user's password.
    user.password = bcryptjs.hashSync(user.password);

    // Create new user in database and send 201 status and location to "/"
    await user.save(user)
        .then(data => {
            res.location(`/`)
            res.status(201).end()
        })
}));

// Get all courses using defined options
router.get('/post', asyncHandler(async (req, res) => {

    await Post.find(function(err, posts) {
        if (posts.length) {
            res.json(posts)
        } else {
            res.status(404).json({
                message: "There are no posts"
            })
        }
    })
}));

// Get course with id using defined options
router.get('/post/:id', asyncHandler(async (req, res) => {

     Post.findById(req.params.id, function (err, post) {
        if (post) {
            res.json(post)
        } else {
            res.status(404).json({
                message: "There are no posts"
            })
        }
    });
}));

// *Authenticated Route to create new course and send location to course uri
router.post('/post', authenticateUser, asyncHandler(async (req, res) => {

    const post = new Post(req.body)
    const error = post.validateSync()
    console.log(error)
    if (!error){
        await post.save(post)
        .then(post => {
            res.location(`/post/${post.id}`);
            res.status(201).end();
        })

    }else {
        const errorMessages = []
        for (const property in error.errors) {
            errorMessages.push(error.errors[property].message)
        }
                // Return the validation errors to the client.
                return res.status(400).json({
                    errors: errorMessages
                });
    }
}));

// *Authenticated Route to Update course with id
router.put('/post/:id', authenticateUser, asyncHandler(async (req, res) => {
    // Find post by id and update
    Post.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
        if (post) {
            res.status(204).end()
        } else {
            res.status(404).json({
                message: "Post Not Found"
            })
        }
    });
}));

// *Authenticated Route to Delete post with id
router.delete('/post/:id', authenticateUser, asyncHandler(async (req, res, next) => {
    // Find post by id and remove
    Post.findByIdAndRemove(req.params.id, function (err, post) {
        if (post) {
            res.status(204).end()
        } else {
            res.status(404).json({
                message: "Post Not Found"
            })
        }
    });
}));

module.exports = router
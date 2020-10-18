const express = require('express')
const router = express.Router()
// Helpers
const {
    userFieldsValidator,
    asyncHandler,
    authenticateUser,
    optionsFilterCourse
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
        // .catch(err => {
        //     res.status(500).send({
        //         message:
        //         err.message || "Some error occurred while creating the user"
        //     })
        // })


}));

// Get all courses using defined options
router.get('/posts', asyncHandler(async (req, res) => {

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

// // Get course with id using defined options
// router.get('/courses/:id', asyncHandler(async (req, res) => {

//     const course = await Course.findByPk(req.params.id, optionsFilterCourse);

//     if (course) {
//         res.json(course)
//     } else {
//         res.status(404).json({
//             message: "There are no courses"
//         })
//     }

// }));

// *Authenticated Route to create new course and send location to course uri
router.post('/posts', authenticateUser, asyncHandler(async (req, res) => {

    const post = new Post(req.body)
    const error = post.validateSync()
    console.log(error)
    if (!error){
        await post.save(post)
        .then(post => {
            res.location(`/posts/${post.id}`);
            res.status(201).end();
        })
        // .catch(err => {
        //     res.status(500).send({
        //         message:
        //         err.message || "Some error occurred while creating the user"
        //     })
        // })
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

// // *Authenticated Route to Update course with id
// router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
//     // Find course by id(primarykey)
//     const course = await Course.findByPk(req.params.id);
//     // If there is a course
//     if (course) {
//         // If authenticad user is the same that owns the course
//         if (course.userId === req.currentUser.id) {
//             // Update course
//             const updated = await Course.update(req.body, {
//                     where: {
//                         id: req.params.id
//                     }
//                 })
//                 .then(updated => {
//                     // The promise returns an array with one or two elements. 
//                     // The first element is always the number of affected rows,
//                     return updated[0] !== 0
//                 })
//             // if any field has been updated
//             if (updated) {
//                 res.status(204).end()
//             } else { // no field has been updated
//                 res.status(404).json({
//                     message: "No fields updated. Same previous values?"
//                 })
//             }
//         } else { // authenticaed user doesn't own course
//             res.status(403).json({
//                 message: "Current user doesn't own the requested course"
//             })
//         }
//     } else { // there is no course for that id
//         res.status(404).json({
//             message: "Course Not Found"
//         })
//     }
// }));

// // *Authenticated Route to Delete course with id
// router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res, next) => {
//     // Find course by id(primarykey)
//     const course = await Course.findByPk(req.params.id);
//     // If there is a course
//     if (course) {
//         // If authenticad user is the same that owns the course
//         if (course.userId === req.currentUser.id) {
//             // delete course
//             await course.destroy()
//             res.status(204).end()
//         } else {// authenticaed user doesn't own course
//             res.status(403).json({
//                 message: "Current user doesn't own the requested course"
//             })
//         }
//     } else {// there is no course for that id
//         res.status(404).json({
//             message: "Course Not Found"
//         })
//     }
// }));

module.exports = router
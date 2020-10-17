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
const User = require('../models').User;
const Course = require('../models').Course;

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
    const user = req.body;

    // Hash the new user's password.
    user.password = bcryptjs.hashSync(user.password);

    // Create new user in database and send 201 status and location to "/"
    await User.create(user)
        .then(user => {
            res.location(`/`)
            res.status(201).end()
        })


}));

// Get all courses using defined options
router.get('/courses', asyncHandler(async (req, res) => {

    const courses = await Course.findAll(optionsFilterCourse);
    
    if (courses) {
        res.json(courses)
    } else {
        res.status(404).json({
            message: "There are no courses"
        })
    }

}));

// Get course with id using defined options
router.get('/courses/:id', asyncHandler(async (req, res) => {

    const course = await Course.findByPk(req.params.id, optionsFilterCourse);

    if (course) {
        res.json(course)
    } else {
        res.status(404).json({
            message: "There are no courses"
        })
    }

}));

// *Authenticated Route to create new course and send location to course uri
router.post('/courses', authenticateUser, asyncHandler(async (req, res) => {

    const course = await Course.create(req.body)
        .then(course => res.location(`/courses/${course.id}`))

    res.status(201).end()

}));

// *Authenticated Route to Update course with id
router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
    // Find course by id(primarykey)
    const course = await Course.findByPk(req.params.id);
    // If there is a course
    if (course) {
        // If authenticad user is the same that owns the course
        if (course.userId === req.currentUser.id) {
            // Update course
            const updated = await Course.update(req.body, {
                    where: {
                        id: req.params.id
                    }
                })
                .then(updated => {
                    // The promise returns an array with one or two elements. 
                    // The first element is always the number of affected rows,
                    return updated[0] !== 0
                })
            // if any field has been updated
            if (updated) {
                res.status(204).end()
            } else { // no field has been updated
                res.status(404).json({
                    message: "No fields updated. Same previous values?"
                })
            }
        } else { // authenticaed user doesn't own course
            res.status(403).json({
                message: "Current user doesn't own the requested course"
            })
        }
    } else { // there is no course for that id
        res.status(404).json({
            message: "Course Not Found"
        })
    }
}));

// *Authenticated Route to Delete course with id
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res, next) => {
    // Find course by id(primarykey)
    const course = await Course.findByPk(req.params.id);
    // If there is a course
    if (course) {
        // If authenticad user is the same that owns the course
        if (course.userId === req.currentUser.id) {
            // delete course
            await course.destroy()
            res.status(204).end()
        } else {// authenticaed user doesn't own course
            res.status(403).json({
                message: "Current user doesn't own the requested course"
            })
        }
    } else {// there is no course for that id
        res.status(404).json({
            message: "Course Not Found"
        })
    }
}));

module.exports = router
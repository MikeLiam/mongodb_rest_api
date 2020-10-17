const auth = require('basic-auth')
const bcryptjs = require('bcryptjs')

// Get references to our user model.
const User = require('./models').User;

// Validation
const {
    check,
} = require('express-validator')

// express-validator validation for user fields. extra: valid email format
const userFieldsValidator = [
    check('firstName')
    .exists({
        checkNull: true,
        checkFalsy: true
    })
    .withMessage('Please provide a value for "firstName"'),
    check('lastName')
    .exists({
        checkNull: true,
        checkFalsy: true
    })
    .withMessage('Please provide a value for "lastName"'),
    check('emailAddress')
    .exists({
        checkNull: true,
        checkFalsy: true
    })
    .withMessage('Please provide a value for "emailAddress"')
    .if(check('emailAddress').notEmpty())
    .normalizeEmail()
    .isEmail()
    .withMessage('Invalid emailAddress'),
    check('password', 'Please provide a value for "password"')
    .exists({
        checkNull: true,
        checkFalsy: true
    }),
    check('confirmPassword', 'Confirm Password must have the same value as the password field')
    .exists()
    .custom((value,{req, loc, path}) =>  value === req.body.password),
]

/**
 * Handler function to wrap each route.
 * @param {Function} cb 
 */
function asyncHandler(cb) {
    return async (req, res, next) => {
        try {
            await cb(req, res, next);
        } catch (err) {
            next(err);
        }
    };
}

/**
 * Middleware to authenticate user through email/password
 */
const authenticateUser =  async (req, res, next) => {
    /**
     * Destructuring assignment to filter properties from a given user
     * @param {Object} user 
     */
    function filterUser(user) {
        return (({
            id,
            emailAddress,
            firstName,
            lastName
        }) => ({
            id,
            emailAddress,
            firstName,
            lastName
        }))(user)
    }

    let message = null;

    // Parse the user's credentials from the Authorization header.
    const credentials = auth(req)
    // If the user's credentials are available
    if (credentials) {
        // Attempt to retrieve the user from the data store
        const userDB = await User.findOne({
            where: {
                emailAddress: credentials.name
            }
        })
        // If a user was successfully retrieved
        if (userDB) {
            const user = userDB.dataValues
            // compare the user's password (from header) to the user's (from retrieved)
            const authenticated = bcryptjs
            .compareSync(credentials.pass, user.password)
            // If the passwords match
            if (authenticated) {
                // Then store the retrieved user object (properties filtered) on the request object
                req.currentUser = filterUser(user)
                console.log("getting user: ".bgYellow, req.currentUser)
            } else {
                message = `Authentication failure for username: ${user.emailAddress}`;
            }
        } else {
            message = `User not found for username: ${credentials.name}`;
        }
    } else {
        message = 'Auth header not found';
    }
    // If user authentication failed
    if (message) {
        console.warn(message);

        // Return a response with a 401 Unauthorized HTTP status code.
        res.status(401).json({
            message: 'Access Denied'
        });
    } else {
        // authentication succeeded
        next();
    }

};

// Object with options to filter course properties to retrieve from database
const optionsFilterCourse = {
    attributes: {
        exclude: ['createdAt', 'updatedAt']
    },
    include: [{
        model: User,
        as: 'createdBy',
        attributes: {
            exclude: ['password', 'createdAt', 'updatedAt']
        }
    }, ]
}

module.exports = {
    userFieldsValidator,
    asyncHandler,
    authenticateUser,
    optionsFilterCourse
}
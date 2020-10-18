
module.exports = mongoose => {
    var schema = mongoose.Schema({
            firstName: {
              type: String,
            },
            lastName: {
              type: String,
            },
            emailAddress: {
              type: String,
            },
            password: {
              type: String,
            },
        },
            { timestamps: true}
        );
    const User = mongoose.model("user", schema);
    return User;
};
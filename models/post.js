
module.exports = mongoose => {
    var schema = mongoose.Schema({
            title: {
              type: String,
              required: '{title} post is required!'
            },
            body: {
              type: String,
              required: '{body} post is required!'
            },
            tags: {
              type: Array,
            }
        },
            { timestamps: true}
        );
    const Post = mongoose.model("post", schema);
    return Post;
};
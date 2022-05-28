const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

let userSchema = new mongoose.Schema({
    name: String,
    lastname: String,
    email: String,
    password: {
        type: String,
        select: false
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    nameAndLastName: String
})

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
module.exports = mongoose.model('User', userSchema);


// npm Doco for more infos: https://www.npmjs.com/package/passport-local-mongoose
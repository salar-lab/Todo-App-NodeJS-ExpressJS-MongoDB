const express = require('express');
const app = express();
const path = require('path');
const dotenv = require('dotenv');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();
dotenv.config({ path: './config.env' });
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = require('./models/userModel');
const Appointment = require('./models/appointmentModel');

const userRoutes = require('./routes/usersController');
const todoRoutes = require('./routes/todoController');
const appointmentRoutes = require('./routes/appointmentsController');

//const Contact = require('./models/contactModel');
const contactRoutes = require('./routes/contactsController');


//middleware for  method override
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended: true }));


// DB Connection
mongoose.connect(
    process.env.DATABASE_LOCAL,
    async (err) => {
        if (err) throw err;
        console.log("conncted to db ")
    }
)


//middleware for express session
app.use(session({
    secret: "nodejs",
    resave: true,
    saveUninitialized: true
}));

// Passport Auth.
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({ usernameField: 'email' },
    User.authenticate()));// User.authenticate() Can be changed to another method
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//middleware for connect flash
app.use(flash());

//Setting messages variables globally
app.use((req, res, next) => {
    res.locals.success_msg = req.flash(('success_msg'));
    res.locals.error_msg = req.flash(('error_msg'));
    res.locals.error = req.flash(('error'));
    res.locals.loggedUser = req.user; // Global Logged User ++++
    next();
});


// use Middlewares in App (Routes)

app.use(userRoutes);
app.use(todoRoutes);
app.use(appointmentRoutes);
app.use(contactRoutes);


// views folder
app.set('views', path.join(__dirname, 'views'));
// ejs engine
app.set('view engine', 'ejs');
// static paths in project
app.use(express.static('public'));
// contacts/searchresult
app.use("/contacts/searchresult", express.static(__dirname + ''));
app.use("/contacts/js", express.static(__dirname + '/public/js'));
app.use("/contacts/public", express.static(__dirname + '/public'));
app.use("/public", express.static(__dirname + '/public'));


// Connection on Port
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log('> Server is running on port : ' + port)
})



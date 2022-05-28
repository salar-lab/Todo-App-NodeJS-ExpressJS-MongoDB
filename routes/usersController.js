const express = require('express');
const router = express.Router();
const async = require('async');
const nodemailer = require('nodemailer');
const passport = require('passport');
const crypto = require('crypto');
const { check, validationResult } = require('express-validator');


//Requiring userModel to send data to database
const User = require('../models/userModel');

// Checks if user is authenticated or not. Please use it always to check 
function checkAuthenticatedUser(req, res, next) {
   if (req.isAuthenticated()) {
      return next();
   }
   req.flash('error_msg', 'Access denied! Please log in first')
   res.redirect('/login');
}

//Get routes
router.get('/', checkAuthenticatedUser, (req, res) => {
   res.render('index');
});

router.get('/reset/:token', (req, res) => {
   User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })
      .then(user => {
         if (!user) {
            req.flash('error_msg', 'The user does not registred or the link is no longer valid. Please Try again');
            res.redirect('/reset');
         }
         res.render('newpassword', { token: req.params.token });
      })
})

router.get('/login', (req, res) => {
   if (req.isAuthenticated()) {
      res.redirect('/')
   } else { res.render('login'); }
});

router.get('/logout', checkAuthenticatedUser, (req, res) => {
   req.logOut();
   req.flash('success_msg', 'Successfully logged out and session is ended');
   res.redirect('/login')
})

router.get('/register', (req, res) => {
   res.render('register');
});


router.get('/reset', (req, res) => {
   res.render('reset');
});

router.get('/changepassword', checkAuthenticatedUser, (req, res) => {
   res.render('changepassword')
})

router.get('/profile/settings', checkAuthenticatedUser, (req, res) => {
   res.render('profileSettings')
})

//Post routes
router.post('/login', passport.authenticate('local', {
   successRedirect: '/',
   failureRedirect: '/login',
   failureFlash: 'Invalid email or password'
}))

router.post('/register', (req, res) => {
   let { name, lastname, email, password } = req.body;
   let userData = {
      name: name,
      lastname: lastname,
      email: email,
      nameAndLastName: name + " " + lastname
   };
   // Check without express-validator also
   if (req.body.password.length < 6) {
      req.flash('error_msg', 'The password must be at least 6 characters long.')
      res.redirect('/register')
   }
   else if (req.body.name == '' || req.body.lasrname == '') {
      req.flash('error_msg', 'first and last name are required fields')
      res.redirect('/register')
   } else {
      User.register(userData, password, (error, user) => {
         if (error) {
            req.flash('error_msg', 'There is an error: ' + error);
            res.redirect('/register');
         }
         passport.authenticate('local')(req, res, () => {
            req.flash('success_msg', 'Successfully registered')
            res.redirect('/login')
         })
      })
   }
})


// Post Routes
// Routes to handle reset password
router.post('/reset', (req, res, next) => {
   // as Waterfall run for more details: https://caolan.github.io/async/v3/docs.html
   async.waterfall([
      (done) => {
         // Calling randomBytes method with callback (buf = buffer)
         // more details https://www.geeksforgeeks.org/node-js-crypto-randombytes-method/
         crypto.randomBytes(16, (err, buf) => {
            let token = buf.toString('hex');
            done(err, token);
         })
      },
      (token, done) => {
         User.findOne({ email: req.body.email })
            .then(user => {
               if (!user) {
                  req.flash('error_msg', 'User is not found!.');
                  res.redirect('/reset');
               }
               user.resetPasswordToken = token;
               // the reset link is valid only for 1 hour (3600000ms = 1 hour)
               user.resetPasswordExpires = Date.now() + 3600000;
               user.save(error => {
                  done(error, token, user)
               })
            })
            .catch(error => {
               req.flash('error_msg', 'There is an error: ' + error);
               //res.redirect('/reset');
            });
      },
      (token, user) => {
         /*
            I tried sending the email through an email account on my hosting and it was done successfully..
            I removed my personal data. You can add your data instead (Smtp email).
            If there is no data, the password reset and Confirm the change will not work.
         */
         let smtpTransport = nodemailer.createTransport({
            host: '', // email server adress
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
               user: '', // email username
               pass: ''  // email password
            },
            tls: {
               rejectUnauthorized:false
           }
         });
         let mailOptions = {
            from: '"ourApps" <appdomain@test.de>',
            to: user.email,
            subject: 'Recovery Email from ourApps. Project',
            text: 'Please click on the link to recover your password: \n \n ' +
               'http://' + req.headers.host + '/reset/' + token
         };
         smtpTransport.sendMail(mailOptions, (error, info) => {
            //req.flash('success_msg', 'Email sent chek your inbox please.');
            //res.redirect('/reset')
            if (error) {
               req.flash('error_msg', 'Error while sending recovery email' + error);
               res.redirect('/reset')
            }
            else {
               req.flash('success_msg', 'Email sent with instructions! Please check your Email inbox .. ');
               res.redirect('/reset')
            }
         })
      }
   ], (error) => {
      if (error) {
         req.flash('error_msg', 'User not found, please make sure the email is correct');
         //   res.redirect('/reset');
      }
   })
})


router.post('/reset/:token', (req, res) => {
   async.waterfall([
      (done) => {
         User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })
            .then(user => {
               if (!user) {
                  req.flash('error_msg', 'The user does not exist or the link is no longer valid. please try again');
                  res.redirect('/reset');
               }
               if (req.body.password !== req.body.confirmpassword) {
                  req.flash('error_msg', "passwords are not match");
                  return res.redirect('/reset');
               }
               user.setPassword(req.body.password, error => {
                  user.resetPasswordToken = undefined;
                  user.resetPasswordExpires = undefined;
                  user.save(err => {
                     req.logIn(user, err => {
                        done(err, user);
                     })
                  });
               });
            })
            .catch(error => {
               req.flash('error_msg', 'There is an error: ' + error);
               res.redirect('/reset');
            });
      },
      (user) => {
         let smtpTransport = nodemailer.createTransport({
            host: '',
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
               user: '', // generated ethereal user
               pass: ''  // generated ethereal password
            }
         });
         let mailOptions = {
            from: '"ourApps" <appdomain@test.de>',
            to: user.email,
            subject: 'Account Security alert',
            text: 'Password changed successfully. you can log in with new password'
         };
         smtpTransport.sendMail(mailOptions, (error, info) => {
            //req.flash('success_msg', 'Email sent chek your inbox please.');
            //res.redirect('/reset')
            if (error) {
               req.flash('error_msg', 'Email sending error:  ' + error);
               res.redirect('/reset')
            }
            else {
               req.flash('success_msg', 'Your password has been changed successfully!');
               res.redirect('/reset')
            }
         })
      }
   ], err => {
      res.redirect('/login');
   });
});

router.put('/profile/settings/:id', [
   check('name', 'Please enter your first name').exists().trim().escape().not().isEmpty(),
   check('lastname', 'Please enter your last name').exists().trim().not().isEmpty(),
   check('email', 'Please enter your email').exists().trim().not().isEmpty(),
],
   (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         for (let i = 0; i < errors.errors.length; i++) {
            req.flash('error_msg', errors.errors[i].msg + '<br>')
         }
         res.redirect('/profile/settings')
      } else {
         let target = { _id: req.params.id };
         User.updateOne(target, {
            $set: {
               name: req.body.name,
               lastname: req.body.lastname,
               email: req.body.email
            }
         }).then(user => {
            req.flash('success_msg', 'Your Profile data edited successfully')
            res.redirect('/profile/settings')
         }).catch(error => {
            req.flash('error_msg', 'There is an error: ' + error)
            res.redirect('/')
         })
      }
   })


router.post('/changepassword',
   [
      check('password', 'The password must be at least 6 characters long').not().isEmpty().isLength({ min: 6 }),
      check('confirmpassword', 'Please confirm your password').not().isEmpty().isLength({ min: 6 }),
   ], (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         for (let i = 0; i < errors.errors.length; i++) {
            req.flash('error_msg', errors.errors[i].msg + '<br>')
            console.log(errors.errors[i].msg);
         }
         res.redirect('/changepassword');
      } else {
         if (req.body.password !== req.body.confirmpassword) {
            req.flash('error_msg', 'Passowrds are not mathch. Please Try Again')
            return res.redirect('/changepassword');
         } else {
            User.findOne({ email: req.user.email })
               .then(user => {
                  user.setPassword(req.body.password, error => {
                     user.save()
                        .then(user => {
                           req.flash('success_msg', 'Password changed successfully');
                           res.redirect('/changepassword');
                        }).catch(error => {
                           req.flash('error_msg', 'ERROR: ' + error);
                           res.redirect('/changepassword');
                        })
                  })
               })
         }
      }
   })

module.exports = router;
module.exports.checkAuthenticatedUser = checkAuthenticatedUser;
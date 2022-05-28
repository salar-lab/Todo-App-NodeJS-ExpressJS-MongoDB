const express = require('express');
const router = express.Router();
const Todo = require('../models/todoModel');
const User = require('../models/userModel');
const checkAuthenticatedUser = require('./usersController').checkAuthenticatedUser;
const multer = require('multer');
const path = require('path');
const async = require('async');
var randomstring = require("randomstring");
const { check, validationResult, body } = require('express-validator');

router.get("/todo", checkAuthenticatedUser, (req, res) => {
    let task = { createdToID: req.user._id };
    Todo.find(task)
        .then(task => {
            //console.log(task);
            res.render('todo/index', { tasks: task })
        }).catch(error => {
            console.log("Sorry .. Error " + error);
        })

})

router.get("/todo/new-task", checkAuthenticatedUser, (req, res) => {
    res.render('todo/newTask')
})


let result = [];
let createdToID = "";
router.get('/fetchLocalUserData', checkAuthenticatedUser, (req, res) => {

    let localUser = User.find({ name: new RegExp(req.query["term"], 'i') },
        { 'name': 1, 'lastname': 1, 'email': 1 }).sort({ "updated_at": -1 })
        .sort({ "created_at": -1 }).limit(20);
    localUser.exec(function (error, data) {
        result = [];
        if (!error) {
            if (data && data.length > 0) {
                data.forEach(user => {
                    let data = { id: user._id, label: user.name + " " + user.lastname + " (" + user.email + ")" };
                    result.push(data);
                });
            }
            res.jsonp(result);
            createdToID = result.createdToID;
            result.forEach(ele => {
                createdToID = ele.id;
            })

        }
    });
});

router.post("/todo/new-task", checkAuthenticatedUser, async (req, res) => {
    let exists = true
    let targetUserID;
    await User.findOne({ nameAndLastName: req.body.createdToName }).then(user => {
        if (!user) {
            exists = false;
        } else {
            targetUserID = user._id;
        }
    })
    /*
    if(!exists){
        req.flash('error_msg', 'Please choose only names from the list of suggested names')
        return res.redirect('/todo/new-task')
    }
    */
    let { title, text, taskType, createdToName, global } = req.body;
    let taskData = {};

    if (taskType == "1" && !exists) {
        taskData = {
            title: title,
            text: text,
            taskType: taskType,
            ownerID: req.user._id,
            createdToName: "Me (" + req.user.name + ")",
            createdToID: req.user._id
            //global: global
        };
        //console.log(taskData);
    } else if (taskType == "2" && !exists) {
        taskData = {
            title: title,
            text: text,
            taskType: taskType,
            ownerID: req.user._id,
            ownerName: req.user.name,
            createdToName: createdToName,
            createdToID: createdToID,
        }
    }
    // in this line -> else if for Global API (We do not have it yet)
    else {
        req.flash('error_msg', 'Please choose only names from the list of suggested names')
        return res.redirect('/todo/new-task')
    }
    Todo.create(taskData)
        .then(task => {
            req.flash('success_msg', 'Task added successfully')
            res.redirect('/todo')
        }).catch(error => {
            req.flash('error_msg', 'An error occurred ' + error)
            res.redirect('/todo')
        })
})



router.get('/todo/edit/:id', checkAuthenticatedUser, (req, res) => {
    let toDoEditData = { _id: req.params.id, user_id: req.user.id };

    Todo.findOne(toDoEditData)
        .then(task => {
            if (req.user.id != task.createdToID) {
                req.flash('error_msg', 'You do not have permission to edit this task')
                return res.redirect("/todo")
            }
            res.render('todo/edit', { task: task })
        }).catch(error => {
            console.log("Sorry .. Error with Edit " + error);
        })
})

router.put("/todo/edit/:id", checkAuthenticatedUser, async (req, res) => {
    let query = { _id: req.params.id };
    Todo.updateOne(query, {
        $set: {
            title: req.body.title,
            text: req.body.text,
        }
    }).then(task => {
        req.flash('success_msg', 'Task edited successfully')
        res.redirect('/todo')
    }).catch(error => {
        req.flash('error_msg', 'An error occurred ' + error)
        res.redirect('/todo')
    })
})


router.delete('/todo/delete/:id', checkAuthenticatedUser, (req, res) => {
    let removeTarget = { _id: req.params.id };

    Todo.findOne(removeTarget).then(taski => {
        if (req.user.id != taski.createdToID) {
            req.flash('error_msg', 'You do not have permission to edit this task')
            return res.redirect("/todo")
        }
        Todo.deleteOne(removeTarget)
            .then(task => {
                req.flash('success_msg', 'Task deleted successfully')
                res.redirect('/todo')
            }).catch(error => {
                req.flash('error_msg', 'An error occurred ' + error)
                res.redirect('/todo')
            })
    })
})


router.put("/todo/inprocess/:id", checkAuthenticatedUser, async (req, res) => {
    let query = { _id: req.params.id };
    Todo.updateOne(query, {
        $set: {
            status: 2
        }
    }).then(task => {
        req.flash('success_msg', 'Your Task now in Process')
        res.redirect('/todo')
    }).catch(error => {
        req.flash('error_msg', 'An error occurred ' + error)
        res.redirect('/todo')
    })
})

router.put("/todo/done/:id", checkAuthenticatedUser, async (req, res) => {
    let query = { _id: req.params.id };
    Todo.updateOne(query, {
        $set: {
            status: 3
        }
    }).then(task => {
        req.flash('success_msg', 'Task is Done!')
        res.redirect('/todo')
    }).catch(error => {
        req.flash('error_msg', 'An error occurred ' + error)
        res.redirect('/todo')
    })
})

router.get('/todo/view/:id', checkAuthenticatedUser, (req, res) => {
    let viewTask = { _id: req.params.id, user_id: req.user.id };

    Todo.findOne(viewTask)
        .then(task => {
            if (req.user.id != task.createdToID) {
                req.flash('error_msg', 'You do not have permission to view this task')
                return res.redirect("/todo")
            }
            res.render('todo/view', { task: task })
        }).catch(error => {
            console.log("Sorry .. Error with Edit " + error);
        })
})

module.exports = router
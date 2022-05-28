const mongoose = require('mongoose');
let todo = new mongoose.Schema({
    title: String,
    text: String,
    taskType: Number, // me - local - global
    ownerID: String,
    ownerName: String,
    createdToID: String,
    createdToName: String,
    targetEmail: String,
    createDate: { type : Date, default: Date.now },

 
    status: { type: Number, default: 1 } // 1 for ToDo - 2 for in Process - 3 for done
});

module.exports = mongoose.model('Todo',todo);
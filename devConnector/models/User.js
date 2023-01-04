const mongoose = require ('mongoose');

mongoose.set("strictQuery", false);
// mongoose.connect(process.env.mongoURI, () => {
//   console.log("Connected to MongoDB");
// });




const UserSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    }, 
    
    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    avatar: {
        type: String
    },

    date: {
        type: Date,
        default: Date.now
    }

});

module.exports = User = mongoose.model('user', UserSchema);


const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

mongoose.set('strictQuery', true);


const connectDB = async () => {
    try {
        await mongoose.connect(db, {
            useNewUrlParser: true,
            // useCreateIndex: true        
        });

        console.log ('mongoDB Connected ...');

    } catch (err) {
        console.log (err.message);
        // Exit process with failure
        process.exit(1);
    }
}

module.exports = connectDB;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.set('strictQuery', false);
// mongoose.connect(process.env.mongoURI, () => {
//   console.log("Connected to MongoDB");
// });

const PostSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'user',
	},

	text: {
		type: String,
		required: true,
	},

	name: {
		type: String,
	},

	avatar: {
		type: String,
	},

	likes: [
		{
			user: {
				type: Schema.Types.ObjectId,
				ref: 'user',
			},
		},
	],

	comments: [
		{
			user: {
				type: Schema.Types.ObjectId,
				ref: 'user',
			},
			text: {
				type: String,
				required: true,
			},
			name: {
				type: String,
			},
			avatar: {
				type: String,
			},
			date: {
				type: Date,
				default: Date.now,
			},
		},
	],

	date: {
		type: Date,
		default: Date.now,
	},
});

module.exports = Post = mongoose.model('post', PostSchema);

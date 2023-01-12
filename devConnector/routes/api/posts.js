const express = require('express');
const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
const router = express.Router();
//-------------------------------------------------------------------------
// @route GET api/posts
// @desc get all post from all users
// @access Private

router.get('/', auth, async (req, res) => {
	try {
		const posts = await Post.find().sort({ date: -1 });
		res.json(posts);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});
//-------------------------------------------------------------------------
// @route GET api/posts/me
// @desc get all post from user
// @access Private

router.get('/me', auth, async (req, res) => {
	try {
		const posts = await Post.find({ user: req.user.id }).sort({ date: -1 });
		if (posts == 0 || !posts) {
			return res.status(400).json({ msg: "user's posts not found " });
		}
		res.json(posts);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

//-------------------------------------------------------------------------
// @route GET api/posts/:id
// @desc get a post from post_id
// @access Private

router.get('/:post_id', auth, async (req, res) => {
	try {
		const posts = await Post.findById(req.params.post_id).sort({ date: -1 });
		if (posts == 0 || !posts) {
			return res.status(404).json({ msg: 'Post not found' });
		}
		res.json(posts);
	} catch (err) {
		console.error(err.message);
		if (err.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Post not found' });
		}

		res.status(500).send('Server Error');
	}
});

//-------------------------------------------------------------------------
// @route POST api/posts
// @desc creat a post
// @access Private

router.post(
	'/',
	[auth, [check('text', 'text is required').not().isEmpty()]], // check text if empty
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		try {
			const user = await User.findById(req.user.id).select('-password');
			const newPost = new Post({
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			});
			const post = await newPost.save();
			res.json(post);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server Error');
		}
	}
);

//-------------------------------------------------------------------------
// @route POST api/posts/comment/:post_id
// @desc create comment for post
// @access Private

router.post(
	'/comment/:post_id',
	[auth, [check('text', 'text is required').not().isEmpty()]], // check text if empty
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		try {
			const post = await Post.findById(req.params.post_id);
			const user = await User.findById(req.user.id).select('-password');

			const newComment = {
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			};

			post.comments.unshift(newComment);

			await post.save();
			res.json(post.comments);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server Error');
		}
	}
);

//-------------------------------------------------------------------------
// @route   DELETE api/posts/:post_id
// @desc    Delete post by post id
// @access  Private

router.delete('/:post_id', auth, async (req, res) => {
	try {
		// get post
		const post = await Post.findById(req.params.post_id);
		if (!post) {
			return res.status(401).json({ msg: 'post not found' });
		}

		//check user
		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'not auth to delete' });
		}
		await post.remove();
		res.json({ msg: 'post removed' });
	} catch (err) {
		console.error(err.message);
		if (err.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'post not found' });
		}
		res.status(500).send('Server Error');
	}
});

//-------------------------------------------------------------------------
// @route   DELETE api/posts/comment/:post_id/:comment_id
// @desc    Delete comment by post_id
// @access  Private

router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
	try {
		// get post
		const post = await Post.findById(req.params.post_id);
		//get comment that match comments id
		const comment =  post.comments.find(
			(comment) => comment.id === req.params.comment_id
		);

		//check if comment exist
		if (!comment) {
			return res.status(404).json({ msg: 'comment not found' });
		}

		//check if comment belong to login user
		if (comment.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'unauthorized user' });
		}
		//find index from id
		const removeIndex = post.comments
			.map(comment => comment.user.toString())
			.indexOf(req.user.id);
		// remove
		post.comments.splice(removeIndex, 1);

		await post.save();
		
		res.json(post.comments);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

//-------------------------------------------------------------------------
// @route   PUT api/posts/:post_id
// @desc    Edit post by post id
// @access  Private

router.put('/:post_id', auth, async (req, res) => {
	try {
		// get post
		const post = await Post.findById(req.params.post_id);
		if (!post) {
			return res.status(401).json({ msg: 'post not found' });
		}

		//check user
		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'not auth to edit' });
		}

		post.text = req.body.text;

		await post.save();
		res.json({ msg: 'post updated', post });
	} catch (err) {
		console.error(err.message);
		if (err.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'post not found' });
		}
		res.status(500).send('Server Error');
	}
});

//-------------------------------------------------------------------------
// @route   PUT api/posts/like/:post_id
// @desc    like a post by post id
// @access  Private

router.put('/like/:post_id', auth, async (req, res) => {
	try {
		// get post
		const post = await Post.findById(req.params.post_id);

		//check if the post has already been like by this user
		if (
			post.likes.filter((like) => like.user.toString() === req.user.id).length >
			0
		) {
			return res.status(400).json({ msg: 'Post already liked' });
		}
		post.likes.unshift({ user: req.user.id });
		await post.save();

		res.json(post.likes);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

//-------------------------------------------------------------------------
// @route   Put api/posts/unlike/:post_id
// @desc    unlike a post by post id
// @access  Private

router.put('/unlike/:post_id', auth, async (req, res) => {
	try {
		// get post
		const post = await Post.findById(req.params.post_id);

		//check if the post has already been like by this user
		if (
			post.likes.filter((like) => like.user.toString() === req.user.id)
				.length === 0
		) {
			return res.status(400).json({ msg: 'Post has not yet been liked' });
		}

		// get remove index
		const removeIndex = post.likes
			.map((like) => like.user.toString())
			.indexOf(req.user.id);
		// remove
		post.likes.splice(removeIndex, 1);

		await post.save();
		res.json(post.likes);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

//-------------------------------------------------------------------------
// @route   Put api/posts/comment/:post_id/:comment_id
// @desc   edit comment from post
// @access  Private

router.put('/comment/:post_id/:comment_id', auth, async (req, res) => {
	try {
		// get post
		const post = await Post.findById(req.params.post_id);
		//get comment that match comments id
		const comment =  post.comments.find(
			(comment) => comment.id === req.params.comment_id
		);

		//check if comment exist
		if (!comment) {
			return res.status(404).json({ msg: 'comment not found' });
		}

		//check if comment belong to login user
		if (comment.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'unauthorized user' });
		}
		//find index from id
        comment.text = req.body.text;
		// const removeIndex = post.comments
		// 	.map(comment => comment.user.toString())
		// 	.indexOf(req.user.id);
		// remove

		await post.save();
		res.json(post.comments);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

module.exports = router;

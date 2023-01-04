const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');

//-------------------------------------------------------------------------
// @route   GET api/profile/me
// @desc    get current user profile
// @access  Private

router.get('/me', auth, async (req, res) => {
  try {
    //find profile (obj) based on user.id, populate profile object only with name and avatar
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      ['name', 'avatar']
    );
    if (!profile) {
      //return error if assosiated profile not found
      return res.status(400).json({ msg: "user's profile not found" });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//-------------------------------------------------------------------------
// @route   GET api/profile
// @desc    get all profiles
// @access  Public

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);

    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//-------------------------------------------------------------------------
// @route   GET api/profile/user/:user_id
// @desc    get profile by user_id
// @access  Public

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({
        errors: [{ msg: 'Profile not found' }],
      });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({
        errors: [{ msg: 'Profile not found' }],
      });
    }
    res.status(500).send('Server Error');
  }
});

//-------------------------------------------------------------------------
// @route   POST api/profile
// @desc    create or update current user profile
// @access  Private

router.post(
  '/',
  [
    auth,
    [
      check('status', 'status is required').not().isEmpty(),
      check('skills', 'skills is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // if there is error
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    //BUILD PROFILE TO TEST--------------------------
    // init required fields of profile
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedIn,
    } = req.body;

    const profileFields = {};
    profileFields.user = req.user.id;

    // build gen info:
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;

    //build skills array:
    if (skills) {
      profileFields.skills = skills.split(',').map((skill) => skill.trim());
    }

    //build social object:
    profileFields.social = {};

    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedIn) profileFields.social.linkedIn = linkedIn;

    try {
      //When profile is build correctly,
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        //if profile already exist, update user profile with new profile above.
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }
      //if profile is not found, create a new one for user.
      profile = new Profile(profileFields);
      //save it
      await profile.save();
      //sent back in Json
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

//-------------------------------------------------------------------------
// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private

router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // if there is error
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const { title, company, location, from, to, current, description } =
      req.body;

    const newExp = { title, company, location, from, to, current, description };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp); // unshift() similar to push(), but add which ever last to the beginning, stacking?
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

//-------------------------------------------------------------------------
// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private

router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // if there is error
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const { school, degree, fieldofstudy, from, to, current, description } =
      req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu); // unshift() similar to push(), but add which ever last to the beginning, stacking?
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

//-------------------------------------------------------------------------
// @route   DELETE api/profile
// @desc    Delete profile, user & post
// @access  Private

router.delete('/', auth, async (req, res) => {
  try {
    // @todo: - remove user posts

    // remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    // remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//-------------------------------------------------------------------------
// @route   DELETE api/profile/experience/:experience_id
// @desc    Delete profile experience ONLY
// @access  Private

router.delete('/experience/:experience_id', auth, async (req, res) => {
  try {
    // get profile
    const profile = await Profile.findOne({ user: req.user.id });
    // find index of want to remove profile
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.experience_id);
    // remove
    profile.experience.splice(removeIndex, 1);

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//-------------------------------------------------------------------------
// @route   DELETE api/profile/education/:education_id
// @desc    Delete profile experience ONLY
// @access  Private

router.delete('/education/:education_id', auth, async (req, res) => {
  try {
    // get profile
    const profile = await Profile.findOne({ user: req.user.id });
    // find index of want to remove profile
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.education_id);
    // remove
    profile.education.splice(removeIndex, 1);

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

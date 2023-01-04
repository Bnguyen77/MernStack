const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');

//-------------------------------------------------------------------------
// @route   Get api/profile/me
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
// @route   Post api/profile
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

module.exports = router;

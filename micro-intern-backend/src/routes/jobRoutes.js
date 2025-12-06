// routes/jobRoutes.js

const express = require('express');
const Job = require('../models/Job');

const router = express.Router();

// POST /api/jobs  -> create a new job
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      skills,
      duration,
      budget,
      location,
      employerId,
    } = req.body;

    const job = new Job({
      title,
      description,
      skills,
      duration,
      budget,
      location,
      employerId,
    });

    const savedJob = await job.save();
    res.status(201).json(savedJob);
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(500).json({ message: 'Failed to create job' });
  }
});

// GET /api/jobs  -> get all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/search  -> filter jobs
router.get('/search', async (req, res) => {
  try {
    const { q, skills, duration, budget, location } = req.query;

    const filter = {};

    // text search on title/description
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    // skills
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      filter.skills = { $in: skillsArray };
    }

    if (duration) {
      filter.duration = duration;
    }

    if (budget) {
      // show jobs with budget <= given value
      filter.budget = { $lte: Number(budget) };
    }

    if (location) {
      filter.location = location;
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error('Error searching jobs:', err);
    res.status(500).json({ message: 'Failed to search jobs' });
  }
});

module.exports = router;

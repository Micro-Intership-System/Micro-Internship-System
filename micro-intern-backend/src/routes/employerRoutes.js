// routes/employerRoutes.js

const express = require('express');
const Employer = require('../models/Employer');

const router = express.Router();

// POST /api/employers  -> create employer profile
router.post('/', async (req, res) => {
  try {
    const {
      name,
      organizationEmail,
      industryType,
      contacts,
      email,
      bio,
    } = req.body;

    const employer = new Employer({
      name,
      organizationEmail,
      industryType,
      contacts,
      email,
      bio,
      // verificationStatus will default to 'pending'
    });

    const savedEmployer = await employer.save();
    res.status(201).json(savedEmployer);
  } catch (err) {
    console.error('Error creating employer:', err);
    res.status(500).json({ message: 'Failed to create employer profile' });
  }
});

// GET /api/employers/:id  -> get employer profile by id
router.get('/:id', async (req, res) => {
  try {
    const employerId = req.params.id;
    const employer = await Employer.findById(employerId);

    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    res.json(employer);
  } catch (err) {
    console.error('Error fetching employer:', err);
    res.status(500).json({ message: 'Failed to fetch employer profile' });
  }
});

// UPDATE employer profile
// PUT /api/employers/:id
router.put('/:id', async (req, res) => {
  try {
    const employerId = req.params.id;

    const updates = {
      name: req.body.name,
      organizationEmail: req.body.organizationEmail,
      industryType: req.body.industryType,
      contacts: req.body.contacts,
      email: req.body.email,
      bio: req.body.bio,
    };

    const updatedEmployer = await Employer.findByIdAndUpdate(
      employerId,
      { $set: updates },
      { new: true }
    );

    if (!updatedEmployer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    res.json(updatedEmployer);
  } catch (err) {
    console.error('Error updating employer:', err);
    res.status(500).json({ message: 'Failed to update employer profile' });
  }
});

// ADD document to employer
// POST /api/employers/:id/documents
router.post('/:id/documents', async (req, res) => {
  try {
    const employerId = req.params.id;
    const { name, url } = req.body; // no real file upload

    const employer = await Employer.findById(employerId);

    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    employer.documents.push({ name, url });
    await employer.save();

    res.status(201).json(employer);
  } catch (err) {
    console.error('Error adding document:', err);
    res.status(500).json({ message: 'Failed to add document' });
  }
});


module.exports = router;

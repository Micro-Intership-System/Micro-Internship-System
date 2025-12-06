const mongoose = require('mongoose');
const Student = require('./models/Student');
const ContactRequest = require('./models/ContactRequest');
const Message = require('./models/Message');
const express = require('express');
const mongoURI = 'mongodb://127.0.0.1:27017/MISys';
const app = express();
app.use(express.json());
const PORT = 1463; // Last 4 digits of my student ID

app.get('/', (req, res) => {
  res.send('Welcome to Micro Internship System API!');
});

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// GET student by ID
app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new student
app.post('/api/students', async (req, res) => {
  try {
    const { name, email, skills, bio } = req.body;

    const student = new Student({
      name,
      email,
      skills,
      bio
    });

    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/test', (req, res) => {
  res.send('API is working');
});

// PUT update an existing student
app.put('/api/students/:id', async (req, res) => {
  try {
    const { name, email, skills, bio } = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { name, email, skills, bio },
      { new: true } // return the updated document
    );

    if (!updatedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(updatedStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST Contact me form
app.post('/api/students/:id/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, jobDescription } = req.body;

    const contact = new ContactRequest({
      studentId: req.params.id,
      firstName,
      lastName,
      email,
      jobDescription
    });

    await contact.save();
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST send a chat message
app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, receiverId, taskId, text } = req.body;

    const message = new Message({
      senderId,
      receiverId,
      taskId,
      text
    });

    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET to see all messages
app.get('/api/messages/task/:taskId', async (req, res) => {
  try {
    const messages = await Message.find({ taskId: req.params.taskId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});

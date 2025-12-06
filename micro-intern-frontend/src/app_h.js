// app.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const mongoURI = 'mongodb://127.0.0.1:27017/MISys';
const employerRoutes = require('./routes/employerRoutes');
const jobRoutes = require('./routes/jobRoutes');
const PORT = 1179;
// Create express app
const app = express();



// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/jobs', jobRoutes);
app.use('/api/employers', employerRoutes);


// MongoDB connection
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));


app.get('/', (req, res) => {
  res.send('Micro Internship API running');
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

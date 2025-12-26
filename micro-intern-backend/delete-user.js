// Script to delete a user from the database
// Usage: node delete-user.js <email>

const mongoose = require("mongoose");
require("dotenv").config();

const UserSchema = new mongoose.Schema({}, { strict: false, collection: "users" });
const User = mongoose.model("User", UserSchema);

async function deleteUser(email) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find and delete user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.name} (${user.email}) - Role: ${user.role}`);
    
    // Delete the user
    await User.deleteOne({ email });
    
    console.log(`✅ User "${email}" has been deleted successfully`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

const email = process.argv[2];

if (!email) {
  console.error("Usage: node delete-user.js <email>");
  console.error("Example: node delete-user.js internshipmicro@gmail.com");
  process.exit(1);
}

deleteUser(email);


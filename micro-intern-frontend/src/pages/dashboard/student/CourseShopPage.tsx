import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import "./css/BrowsePage.css";

type Course = {
  _id: string;
  title: string;
  description: string;
  cost: number;
  category: string;
  duration: string;
  instructor?: string;
  thumbnailUrl?: string;
  learningOutcomes?: string[];
  prerequisites?: string[];
};

type Enrollment = {
  _id: string;
  courseId: Course;
  progress: number;
  completedAt?: string;
  enrolledAt: string;
};

// Predefined courses (100+ Udemy-style courses)
const PREDEFINED_COURSES: Course[] = [
  // Web Development
  { _id: "web-1", title: "Complete Web Development Bootcamp", description: "Master HTML, CSS, JavaScript, React, Node.js, and more", cost: 150, category: "Web Development", duration: "60 hours", instructor: "Dr. Angela Yu" },
  { _id: "web-2", title: "The Complete JavaScript Course 2024", description: "Modern JavaScript from scratch - ES6+, OOP, Async/Await", cost: 120, category: "Web Development", duration: "68 hours", instructor: "Jonas Schmedtmann" },
  { _id: "web-3", title: "React - The Complete Guide", description: "Hooks, Redux, Context API, React Router, Next.js", cost: 130, category: "Web Development", duration: "48 hours", instructor: "Maximilian Schwarzmüller" },
  { _id: "web-4", title: "Vue.js - The Complete Guide", description: "Vue 3 Composition API, Vuex, Vue Router, TypeScript", cost: 125, category: "Web Development", duration: "42 hours", instructor: "Maximilian Schwarzmüller" },
  { _id: "web-5", title: "Angular - The Complete Guide", description: "Master Angular and build amazing reactive web apps", cost: 140, category: "Web Development", duration: "35 hours", instructor: "Maximilian Schwarzmüller" },
  { _id: "web-6", title: "Node.js - The Complete Guide", description: "MVC, REST APIs, GraphQL, Deno, SQL, MongoDB", cost: 135, category: "Web Development", duration: "40 hours", instructor: "Maximilian Schwarzmüller" },
  { _id: "web-7", title: "Next.js & React - The Complete Guide", description: "Build production-ready React apps with Next.js", cost: 145, category: "Web Development", duration: "38 hours", instructor: "Maximilian Schwarzmüller" },
  { _id: "web-8", title: "Full Stack Web Development with Flask", description: "Python Flask, SQLAlchemy, REST APIs, Authentication", cost: 110, category: "Web Development", duration: "32 hours", instructor: "Jose Portilla" },
  { _id: "web-9", title: "Django 4 & Python: Complete Course", description: "Build real-world web applications with Django", cost: 115, category: "Web Development", duration: "30 hours", instructor: "Nick Walter" },
  { _id: "web-10", title: "PHP with Laravel for Beginners", description: "Learn Laravel PHP framework from scratch", cost: 100, category: "Web Development", duration: "28 hours", instructor: "Edwin Diaz" },
  
  // Data Science & AI
  { _id: "ds-1", title: "Machine Learning A-Z: Hands-On Python", description: "Data Science, Tensorflow, Artificial Intelligence, Neural Networks", cost: 200, category: "Data Science", duration: "44 hours", instructor: "Kirill Eremenko" },
  { _id: "ds-2", title: "Python for Data Science and Machine Learning", description: "NumPy, Pandas, Matplotlib, Seaborn, Scikit-learn", cost: 180, category: "Data Science", duration: "100 hours", instructor: "Jose Portilla" },
  { _id: "ds-3", title: "Deep Learning A-Z: Neural Networks", description: "Artificial Neural Networks, Convolutional Neural Networks, Recurrent Neural Networks", cost: 220, category: "Data Science", duration: "23 hours", instructor: "Kirill Eremenko" },
  { _id: "ds-4", title: "Data Science and Machine Learning Bootcamp", description: "Learn data science, machine learning, and artificial intelligence", cost: 190, category: "Data Science", duration: "25 hours", instructor: "Jose Portilla" },
  { _id: "ds-5", title: "TensorFlow 2.0 Complete Course", description: "Deep Learning and Artificial Intelligence", cost: 210, category: "Data Science", duration: "20 hours", instructor: "Hadelin de Ponteves" },
  { _id: "ds-6", title: "Complete SQL Bootcamp", description: "PostgreSQL, MySQL, SQL Server, Oracle, SQLite", cost: 130, category: "Data Science", duration: "9 hours", instructor: "Jose Portilla" },
  { _id: "ds-7", title: "Tableau 2024 A-Z: Hands-On Tableau Training", description: "Data visualization and business intelligence", cost: 150, category: "Data Science", duration: "9.5 hours", instructor: "Kirill Eremenko" },
  { _id: "ds-8", title: "R Programming A-Z: R For Data Science", description: "Learn R Programming for Data Science and Statistical Analysis", cost: 160, category: "Data Science", duration: "10.5 hours", instructor: "Kirill Eremenko" },
  { _id: "ds-9", title: "Complete Python Bootcamp", description: "Go from zero to hero in Python 3", cost: 140, category: "Data Science", duration: "22 hours", instructor: "Jose Portilla" },
  { _id: "ds-10", title: "Natural Language Processing with Python", description: "NLP, Text Classification, Sentiment Analysis, NLTK", cost: 170, category: "Data Science", duration: "12 hours", instructor: "Jose Portilla" },
  
  // Mobile Development
  { _id: "mobile-1", title: "iOS & Swift - The Complete iOS App Development Bootcamp", description: "From Beginner to iOS App Developer with Just One Course", cost: 180, category: "Mobile Development", duration: "60 hours", instructor: "Dr. Angela Yu" },
  { _id: "mobile-2", title: "The Complete Android Oreo Developer Course", description: "Build 23 Android apps and learn to code like a pro", cost: 175, category: "Mobile Development", duration: "80 hours", instructor: "Rob Percival" },
  { _id: "mobile-3", title: "Flutter & Dart - The Complete Guide", description: "Build native mobile apps for iOS and Android", cost: 160, category: "Mobile Development", duration: "42 hours", instructor: "Maximilian Schwarzmüller" },
  { _id: "mobile-4", title: "React Native - The Practical Guide", description: "Build native iOS and Android apps with React Native", cost: 155, category: "Mobile Development", duration: "35 hours", instructor: "Maximilian Schwarzmüller" },
  { _id: "mobile-5", title: "Complete Kotlin Android Development Masterclass", description: "Learn Kotlin Android app development from scratch", cost: 170, category: "Mobile Development", duration: "28 hours", instructor: "Tim Buchalka" },
  { _id: "mobile-6", title: "Xamarin Forms: Build Native Cross-Platform Apps", description: "Build native iOS, Android, and Windows apps with C#", cost: 145, category: "Mobile Development", duration: "30 hours", instructor: "Mosh Hamedani" },
  { _id: "mobile-7", title: "Ionic - Build iOS, Android & Web Apps", description: "Build native mobile apps with Ionic Framework", cost: 140, category: "Mobile Development", duration: "25 hours", instructor: "Maximilian Schwarzmüller" },
  { _id: "mobile-8", title: "SwiftUI Masterclass: iOS App Development", description: "Build beautiful iOS apps with SwiftUI", cost: 165, category: "Mobile Development", duration: "32 hours", instructor: "Robert Petras" },
  
  // Programming Languages
  { _id: "lang-1", title: "Java Programming Masterclass", description: "Updated for Java 17 - Learn Java from scratch", cost: 150, category: "Programming", duration: "80 hours", instructor: "Tim Buchalka" },
  { _id: "lang-2", title: "C# Programming - Complete Course", description: "Master C# and .NET Framework", cost: 145, category: "Programming", duration: "40 hours", instructor: "Mosh Hamedani" },
  { _id: "lang-3", title: "C++ Programming Course", description: "Beginner to Advanced - Learn C++", cost: 140, category: "Programming", duration: "45 hours", instructor: "Tim Buchalka" },
  { _id: "lang-4", title: "Go Programming Language (Golang)", description: "The Complete Go Bootcamp", cost: 135, category: "Programming", duration: "20 hours", instructor: "Jose Portilla" },
  { _id: "lang-5", title: "Rust Programming Language", description: "Complete Rust Developer Course", cost: 155, category: "Programming", duration: "18 hours", instructor: "Nathan Stocks" },
  { _id: "lang-6", title: "TypeScript - The Complete Developer's Guide", description: "Master TypeScript and build large-scale applications", cost: 130, category: "Programming", duration: "24 hours", instructor: "Stephen Grider" },
  { _id: "lang-7", title: "Scala & Functional Programming", description: "Learn Scala from scratch", cost: 160, category: "Programming", duration: "22 hours", instructor: "Daniel Ciocîrlan" },
  { _id: "lang-8", title: "Ruby on Rails 6 - Learn Web Development", description: "Build web applications with Ruby on Rails", cost: 125, category: "Programming", duration: "30 hours", instructor: "Mashrur Hossain" },
  
  // Cloud & DevOps
  { _id: "cloud-1", title: "AWS Certified Solutions Architect", description: "Associate SAA-C03 - Complete Course", cost: 200, category: "Cloud & DevOps", duration: "27 hours", instructor: "Stephane Maarek" },
  { _id: "cloud-2", title: "Docker & Kubernetes: The Complete Guide", description: "Build, test, and deploy Docker applications with Kubernetes", cost: 180, category: "Cloud & DevOps", duration: "20 hours", instructor: "Stephen Grider" },
  { _id: "cloud-3", title: "Google Cloud Platform (GCP) Complete", description: "Master GCP - Cloud Architect, Cloud Engineer, Cloud Developer", cost: 190, category: "Cloud & DevOps", duration: "25 hours", instructor: "Ryan Kroonenburg" },
  { _id: "cloud-4", title: "Microsoft Azure Fundamentals", description: "AZ-900 - Complete Azure Certification Course", cost: 175, category: "Cloud & DevOps", duration: "15 hours", instructor: "Scott Duffy" },
  { _id: "cloud-5", title: "Terraform for AWS - Beginner to Expert", description: "Infrastructure as Code with Terraform", cost: 170, category: "Cloud & DevOps", duration: "18 hours", instructor: "Zeal Vora" },
  { _id: "cloud-6", title: "Complete Linux Administration Bootcamp", description: "Master Linux system administration", cost: 140, category: "Cloud & DevOps", duration: "22 hours", instructor: "Jason Cannon" },
  { _id: "cloud-7", title: "Jenkins, From Zero To Hero", description: "Become a DevOps Jenkins Master", cost: 150, category: "Cloud & DevOps", duration: "12 hours", instructor: "Ricardo Andre Gonzalez" },
  { _id: "cloud-8", title: "Ansible for the Absolute Beginner", description: "Hands-On - Learn Ansible DevOps", cost: 145, category: "Cloud & DevOps", duration: "10 hours", instructor: "Mumshad Mannambeth" },
  
  // Cybersecurity
  { _id: "sec-1", title: "Ethical Hacking from Scratch", description: "Learn ethical hacking, penetration testing, and network security", cost: 220, category: "Cybersecurity", duration: "15 hours", instructor: "Zaid Sabih" },
  { _id: "sec-2", title: "Complete Cyber Security Course", description: "Volume 1: Hackers Exposed", cost: 200, category: "Cybersecurity", duration: "12 hours", instructor: "Nathan House" },
  { _id: "sec-3", title: "CompTIA Security+ (SY0-601) Complete Course", description: "Get certified in cybersecurity", cost: 210, category: "Cybersecurity", duration: "20 hours", instructor: "Mike Meyers" },
  { _id: "sec-4", title: "Network Security & Ethical Hacking", description: "Complete Network Security Course", cost: 195, category: "Cybersecurity", duration: "18 hours", instructor: "Ermin Kreponic" },
  { _id: "sec-5", title: "Web Application Penetration Testing", description: "Learn web application security and penetration testing", cost: 205, category: "Cybersecurity", duration: "14 hours", instructor: "Zaid Sabih" },
  
  // Game Development
  { _id: "game-1", title: "Complete C# Unity Game Developer 2D", description: "Learn Unity, C#, and build 2D games", cost: 180, category: "Game Development", duration: "50 hours", instructor: "Rick Davidson" },
  { _id: "game-2", title: "Unreal Engine 5 C++ Developer", description: "Learn C++ and make video games", cost: 200, category: "Game Development", duration: "45 hours", instructor: "Sam Pattuzzi" },
  { _id: "game-3", title: "Godot 4 Game Development", description: "Create 2D and 3D games with Godot", cost: 160, category: "Game Development", duration: "30 hours", instructor: "HeartBeast" },
  { _id: "game-4", title: "Complete Blender Creator: Learn 3D Modelling", description: "Use Blender to create beautiful 3D models for video games", cost: 170, category: "Game Development", duration: "40 hours", instructor: "Rick Davidson" },
  { _id: "game-5", title: "Unity 2D Game Development", description: "Build 2D games with Unity and C#", cost: 175, category: "Game Development", duration: "35 hours", instructor: "James Doyle" },
  
  // Design
  { _id: "design-1", title: "UI/UX Design Bootcamp", description: "Learn Figma, User Interface Design, User Experience Design", cost: 150, category: "Design", duration: "30 hours", instructor: "Daniel Walter Scott" },
  { _id: "design-2", title: "Adobe Photoshop CC - Essentials Training", description: "Master Photoshop CC without any prior knowledge", cost: 120, category: "Design", duration: "12 hours", instructor: "Daniel Walter Scott" },
  { _id: "design-3", title: "Adobe Illustrator CC - Essentials Training", description: "Learn Illustrator CC to create vector graphics", cost: 125, category: "Design", duration: "10 hours", instructor: "Daniel Walter Scott" },
  { _id: "design-4", title: "Figma UI/UX Design Essentials", description: "Master Figma for UI/UX design", cost: 130, category: "Design", duration: "15 hours", instructor: "Daniel Walter Scott" },
  { _id: "design-5", title: "Adobe XD UI/UX Design", description: "Complete Adobe XD course for UI/UX design", cost: 135, category: "Design", duration: "14 hours", instructor: "Daniel Walter Scott" },
  { _id: "design-6", title: "Sketch App: The Complete Guide", description: "Learn Sketch for UI/UX design", cost: 140, category: "Design", duration: "16 hours", instructor: "Joseph Angelo Todaro" },
  
  // Business & Marketing
  { _id: "biz-1", title: "Digital Marketing Masterclass", description: "23 Courses in 1 - SEO, Google Ads, Facebook Ads, Email Marketing", cost: 160, category: "Business", duration: "50 hours", instructor: "Daragh Walsh" },
  { _id: "biz-2", title: "Google Analytics Certification", description: "GA4 - Google Analytics 4 Certification Course", cost: 140, category: "Business", duration: "8 hours", instructor: "Mikel Redondo" },
  { _id: "biz-3", title: "SEO Training: Master Search Engine Optimization", description: "Learn SEO from scratch - rank #1 in Google", cost: 150, category: "Business", duration: "12 hours", instructor: "Moz Academy" },
  { _id: "biz-4", title: "Social Media Marketing Mastery", description: "Facebook, Instagram, Twitter, LinkedIn, YouTube, Pinterest", cost: 145, category: "Business", duration: "18 hours", instructor: "Ben Silverstein" },
  { _id: "biz-5", title: "Content Marketing Masterclass", description: "Content Marketing Strategy, Content Creation, Content Promotion", cost: 155, category: "Business", duration: "20 hours", instructor: "Brad Merrill" },
  
  // Database
  { _id: "db-1", title: "MongoDB - The Complete Developer's Guide", description: "Master MongoDB database development", cost: 140, category: "Database", duration: "20 hours", instructor: "Maximilian Schwarzmüller" },
  { _id: "db-2", title: "Redis - The Complete Developer's Guide", description: "Learn Redis from scratch", cost: 130, category: "Database", duration: "8 hours", instructor: "Stephen Grider" },
  { _id: "db-3", title: "Elasticsearch 7 and the Elastic Stack", description: "Complete Elasticsearch tutorial - search, analyze, and visualize data", cost: 150, category: "Database", duration: "10 hours", instructor: "Frank Kane" },
  { _id: "db-4", title: "Apache Kafka Series", description: "Learn Kafka for Beginners", cost: 145, category: "Database", duration: "12 hours", instructor: "Stephane Maarek" },
  { _id: "db-5", title: "Neo4j: Graph Database Foundations", description: "Learn Neo4j graph database", cost: 135, category: "Database", duration: "9 hours", instructor: "Rik Van Bruggen" },
  
  // Blockchain
  { _id: "block-1", title: "Ethereum and Solidity: The Complete Developer's Guide", description: "Use Ethereum, Solidity, and Smart Contracts to build production-ready apps", cost: 200, category: "Blockchain", duration: "24 hours", instructor: "Stephen Grider" },
  { _id: "block-2", title: "Blockchain A-Z: Build a Blockchain", description: "Learn key Blockchain concepts, intuition and practical training", cost: 190, category: "Blockchain", duration: "14.5 hours", instructor: "Kirill Eremenko" },
  { _id: "block-3", title: "Bitcoin and Cryptocurrency Technologies", description: "Complete Bitcoin and Cryptocurrency Course", cost: 180, category: "Blockchain", duration: "16 hours", instructor: "George Levy" },
  { _id: "block-4", title: "Hyperledger Fabric for Blockchain Applications", description: "Build enterprise blockchain applications", cost: 195, category: "Blockchain", duration: "18 hours", instructor: "Rajeev Sakhuja" },
  
  // Testing
  { _id: "test-1", title: "Selenium WebDriver with Java", description: "Basics to Advanced + Frameworks", cost: 150, category: "Testing", duration: "40 hours", instructor: "Rahul Shetty" },
  { _id: "test-2", title: "Cypress End-to-End Testing", description: "Learn Cypress from scratch", cost: 140, category: "Testing", duration: "12 hours", instructor: "Federico Garay" },
  { _id: "test-3", title: "API Testing with Postman", description: "Complete Guide to API Testing", cost: 130, category: "Testing", duration: "10 hours", instructor: "Valentin Despa" },
  { _id: "test-4", title: "Jest Testing Framework", description: "Master Jest for JavaScript testing", cost: 135, category: "Testing", duration: "8 hours", instructor: "Stephen Grider" },
  
  // More courses to reach 100+
  { _id: "web-11", title: "GraphQL with React: The Complete Developer's Guide", description: "Build production-ready apps with GraphQL", cost: 145, category: "Web Development", duration: "15 hours", instructor: "Stephen Grider" },
  { _id: "web-12", title: "Webpack 5: The Complete Guide", description: "Master Webpack for modern JavaScript development", cost: 120, category: "Web Development", duration: "10 hours", instructor: "Maximilian Schwarzmüller" },
  { _id: "web-13", title: "TypeScript: The Complete Developer's Guide", description: "Master TypeScript and build large-scale applications", cost: 130, category: "Web Development", duration: "24 hours", instructor: "Stephen Grider" },
  { _id: "web-14", title: "Sass & SCSS Complete Course", description: "Learn Sass and SCSS from scratch", cost: 100, category: "Web Development", duration: "6 hours", instructor: "Brad Hussey" },
  { _id: "web-15", title: "Tailwind CSS: From Zero to Production", description: "Master Tailwind CSS and build modern websites", cost: 110, category: "Web Development", duration: "8 hours", instructor: "Traversy Media" },
  { _id: "ds-11", title: "Apache Spark with Scala", description: "Hands-On Big Data Analytics", cost: 180, category: "Data Science", duration: "16 hours", instructor: "Jose Portilla" },
  { _id: "ds-12", title: "Apache Airflow: The Hands-On Guide", description: "Master workflow orchestration with Airflow", cost: 170, category: "Data Science", duration: "14 hours", instructor: "Marc Lamberti" },
  { _id: "mobile-9", title: "Ionic 6 & Angular: Build iOS, Android & Web Apps", description: "Build cross-platform mobile apps", cost: 150, category: "Mobile Development", duration: "28 hours", instructor: "Simon Grimm" },
  { _id: "mobile-10", title: "Build Native Mobile Apps with NativeScript", description: "Learn NativeScript for iOS and Android", cost: 145, category: "Mobile Development", duration: "25 hours", instructor: "Maximilian Schwarzmüller" },
  { _id: "lang-9", title: "Complete Python Masterclass", description: "Go from zero to hero in Python", cost: 140, category: "Programming", duration: "22 hours", instructor: "Jose Portilla" },
  { _id: "lang-10", title: "Complete C# Masterclass", description: "Learn C# Programming - WPF, Databases, Linq, Collections, Game Development", cost: 150, category: "Programming", duration: "50 hours", instructor: "Denis Panjuta" },
  { _id: "cloud-9", title: "AWS Lambda & Serverless Architecture", description: "Master serverless computing with AWS Lambda", cost: 175, category: "Cloud & DevOps", duration: "12 hours", instructor: "Stephane Maarek" },
  { _id: "cloud-10", title: "Git & GitHub - The Practical Guide", description: "Master Git and GitHub for version control", cost: 110, category: "Cloud & DevOps", duration: "8 hours", instructor: "Maximilian Schwarzmüller" },
  { _id: "sec-6", title: "OWASP Top 10 Security Risks", description: "Learn about the most critical web application security risks", cost: 195, category: "Cybersecurity", duration: "10 hours", instructor: "Mumshad Mannambeth" },
  { _id: "game-6", title: "Unity 3D Game Development", description: "Build 3D games with Unity", cost: 180, category: "Game Development", duration: "45 hours", instructor: "Ben Tristem" },
  { _id: "design-7", title: "Adobe After Effects CC", description: "Complete After Effects Course - Motion Graphics & VFX", cost: 145, category: "Design", duration: "18 hours", instructor: "Louay Zambarakji" },
  { _id: "biz-6", title: "Google Ads (AdWords) Certification", description: "Become a Google Ads Certified Professional", cost: 155, category: "Business", duration: "15 hours", instructor: "Isaac Rudansky" },
  { _id: "db-6", title: "PostgreSQL: Advanced SQL Queries", description: "Master advanced PostgreSQL queries", cost: 140, category: "Database", duration: "14 hours", instructor: "Jon Avis" },
  { _id: "block-5", title: "NFT (Non-Fungible Tokens) Course", description: "Create, Buy, Sell and Invest in NFTs", cost: 185, category: "Blockchain", duration: "12 hours", instructor: "Henri Arslan" },
  { _id: "test-5", title: "Playwright End-to-End Testing", description: "Master Playwright for web automation", cost: 145, category: "Testing", duration: "11 hours", instructor: "Dilpreet Johal" },
  
  // Additional courses to reach 100+
  { _id: "web-16", title: "Express.js & Node.js - Complete Guide", description: "Build RESTful APIs and web applications with Express", cost: 125, category: "Web Development", duration: "18 hours", instructor: "Maximilian Schwarzmüller" },
  { _id: "web-17", title: "Svelte.js - The Complete Guide", description: "Build fast, reactive web applications with Svelte", cost: 120, category: "Web Development", duration: "16 hours", instructor: "Maximilian Schwarzmüller" },
  { _id: "web-18", title: "Nuxt.js 3 - Vue.js Framework", description: "Build server-side rendered Vue.js applications", cost: 135, category: "Web Development", duration: "20 hours", instructor: "Maximilian Schwarzmüller" },
  { _id: "web-19", title: "Gatsby.js - Build Static Sites", description: "Create blazing fast static websites with Gatsby", cost: 130, category: "Web Development", duration: "14 hours", instructor: "Andrew Mead" },
  { _id: "web-20", title: "WebSocket & Socket.io", description: "Real-time web applications with WebSocket and Socket.io", cost: 115, category: "Web Development", duration: "12 hours", instructor: "Stephen Grider" },
  
  { _id: "ds-13", title: "Computer Vision with Python", description: "OpenCV, Image Processing, Object Detection", cost: 185, category: "Data Science", duration: "15 hours", instructor: "Jose Portilla" },
  { _id: "ds-14", title: "Time Series Analysis with Python", description: "Forecasting, ARIMA, LSTM, Prophet", cost: 175, category: "Data Science", duration: "13 hours", instructor: "Jose Portilla" },
  { _id: "ds-15", title: "Reinforcement Learning A-Z", description: "Q-Learning, Deep Q-Learning, Policy Gradient", cost: 200, category: "Data Science", duration: "17 hours", instructor: "Kirill Eremenko" },
  { _id: "ds-16", title: "Data Engineering Bootcamp", description: "ETL, Data Pipelines, Apache Airflow, Spark", cost: 190, category: "Data Science", duration: "22 hours", instructor: "Jose Portilla" },
  { _id: "ds-17", title: "Power BI Desktop Complete Course", description: "Data visualization and business intelligence", cost: 160, category: "Data Science", duration: "11 hours", instructor: "Maven Analytics" },
  
  { _id: "mobile-11", title: "Kotlin Multiplatform Mobile Development", description: "Build iOS and Android apps with Kotlin", cost: 165, category: "Mobile Development", duration: "26 hours", instructor: "Philipp Lackner" },
  { _id: "mobile-12", title: "Swift 5 Programming Masterclass", description: "Learn Swift 5 from scratch", cost: 155, category: "Mobile Development", duration: "24 hours", instructor: "Nick Walter" },
  { _id: "mobile-13", title: "React Native with TypeScript", description: "Build type-safe mobile apps with React Native", cost: 150, category: "Mobile Development", duration: "30 hours", instructor: "Stephen Grider" },
  { _id: "mobile-14", title: "Flutter Firebase App Development", description: "Build full-stack mobile apps with Flutter and Firebase", cost: 160, category: "Mobile Development", duration: "35 hours", instructor: "Maximilian Schwarzmüller" },
  
  { _id: "lang-11", title: "Python for Finance", description: "Financial Analysis, Trading, Algorithmic Trading", cost: 170, category: "Programming", duration: "19 hours", instructor: "Jose Portilla" },
  { _id: "lang-12", title: "JavaScript Algorithms and Data Structures", description: "Master JavaScript algorithms and problem solving", cost: 125, category: "Programming", duration: "21 hours", instructor: "Colt Steele" },
  { _id: "lang-13", title: "Advanced Python Programming", description: "Decorators, Generators, Metaclasses, Async Programming", cost: 145, category: "Programming", duration: "16 hours", instructor: "Jose Portilla" },
  { _id: "lang-14", title: "Functional Programming in JavaScript", description: "Learn functional programming concepts and patterns", cost: 130, category: "Programming", duration: "14 hours", instructor: "Stephen Grider" },
  
  { _id: "cloud-11", title: "AWS Certified Developer Associate", description: "DVA-C02 - Complete Certification Course", cost: 195, category: "Cloud & DevOps", duration: "22 hours", instructor: "Stephane Maarek" },
  { _id: "cloud-12", title: "Kubernetes for the Absolute Beginner", description: "Hands-on Kubernetes tutorial", cost: 175, category: "Cloud & DevOps", duration: "16 hours", instructor: "Mumshad Mannambeth" },
  { _id: "cloud-13", title: "CI/CD with Jenkins and Docker", description: "Build automated CI/CD pipelines", cost: 160, category: "Cloud & DevOps", duration: "13 hours", instructor: "Ricardo Andre Gonzalez" },
  { _id: "cloud-14", title: "AWS CloudFormation Masterclass", description: "Infrastructure as Code with CloudFormation", cost: 180, category: "Cloud & DevOps", duration: "15 hours", instructor: "Stephane Maarek" },
  
  { _id: "sec-7", title: "Kali Linux for Ethical Hacking", description: "Learn ethical hacking with Kali Linux", cost: 210, category: "Cybersecurity", duration: "16 hours", instructor: "Zaid Sabih" },
  { _id: "sec-8", title: "Certified Ethical Hacker (CEH)", description: "Complete CEH certification course", cost: 225, category: "Cybersecurity", duration: "25 hours", instructor: "Nathan House" },
  { _id: "sec-9", title: "Penetration Testing with Metasploit", description: "Learn penetration testing techniques", cost: 200, category: "Cybersecurity", duration: "12 hours", instructor: "Zaid Sabih" },
  
  { _id: "game-7", title: "Unity Multiplayer Game Development", description: "Build multiplayer games with Unity and Photon", cost: 190, category: "Game Development", duration: "38 hours", instructor: "Tom Weiland" },
  { _id: "game-8", title: "Unreal Engine Blueprint Visual Scripting", description: "Create games without coding using Blueprints", cost: 170, category: "Game Development", duration: "28 hours", instructor: "Rob Brooks" },
  { _id: "game-9", title: "Game Design and Development", description: "Learn game design principles and mechanics", cost: 165, category: "Game Development", duration: "32 hours", instructor: "James Portnow" },
  
  { _id: "design-8", title: "Adobe Premiere Pro CC", description: "Complete Video Editing Course", cost: 150, category: "Design", duration: "20 hours", instructor: "Daniel Walter Scott" },
  { _id: "design-9", title: "Adobe InDesign CC", description: "Master InDesign for print and digital publishing", cost: 140, category: "Design", duration: "17 hours", instructor: "Daniel Walter Scott" },
  { _id: "design-10", title: "Motion Graphics with After Effects", description: "Create stunning motion graphics and animations", cost: 155, category: "Design", duration: "22 hours", instructor: "Louay Zambarakji" },
  
  { _id: "biz-7", title: "Facebook Ads & Instagram Ads Mastery", description: "Complete social media advertising course", cost: 150, category: "Business", duration: "14 hours", instructor: "Isaac Rudansky" },
  { _id: "biz-8", title: "Email Marketing Mastery", description: "Build and grow your email list", cost: 135, category: "Business", duration: "10 hours", instructor: "Ben Silverstein" },
  { _id: "biz-9", title: "Affiliate Marketing Masterclass", description: "Learn affiliate marketing strategies", cost: 145, category: "Business", duration: "12 hours", instructor: "Paulette Ensign" },
  { _id: "biz-10", title: "E-commerce Marketing", description: "Drive sales with e-commerce marketing strategies", cost: 155, category: "Business", duration: "16 hours", instructor: "Brad Merrill" },
  
  { _id: "db-7", title: "MySQL Database Administration", description: "Master MySQL database management", cost: 145, category: "Database", duration: "15 hours", instructor: "Jason Cannon" },
  { _id: "db-8", title: "Oracle Database 19c Administration", description: "Complete Oracle DBA course", cost: 180, category: "Database", duration: "28 hours", instructor: "Bob Bryla" },
  { _id: "db-9", title: "Cassandra NoSQL Database", description: "Learn Apache Cassandra for big data", cost: 165, category: "Database", duration: "13 hours", instructor: "Edward Viaene" },
  
  { _id: "block-6", title: "Smart Contracts Development", description: "Build and deploy smart contracts", cost: 195, category: "Blockchain", duration: "20 hours", instructor: "Stephen Grider" },
  { _id: "block-7", title: "Web3 Development with Solidity", description: "Build decentralized applications", cost: 200, category: "Blockchain", duration: "22 hours", instructor: "Stephen Grider" },
  
  { _id: "test-6", title: "Test Automation with Selenium", description: "Master Selenium WebDriver automation", cost: 150, category: "Testing", duration: "35 hours", instructor: "Rahul Shetty" },
  { _id: "test-7", title: "API Testing with REST Assured", description: "Automate API testing with REST Assured", cost: 140, category: "Testing", duration: "14 hours", instructor: "Rahul Shetty" },
  { _id: "test-8", title: "Mobile App Testing", description: "Test iOS and Android applications", cost: 145, category: "Testing", duration: "16 hours", instructor: "Rahul Shetty" },
  
  // Additional specialized courses
  { _id: "spec-1", title: "Microservices with Node.js and React", description: "Build scalable microservices architecture", cost: 175, category: "Web Development", duration: "42 hours", instructor: "Stephen Grider" },
  { _id: "spec-2", title: "System Design Interview Prep", description: "Master system design for technical interviews", cost: 160, category: "Programming", duration: "18 hours", instructor: "Gaurav Sen" },
  { _id: "spec-3", title: "Docker Swarm Orchestration", description: "Container orchestration with Docker Swarm", cost: 155, category: "Cloud & DevOps", duration: "11 hours", instructor: "Mumshad Mannambeth" },
  { _id: "spec-4", title: "Prometheus & Grafana", description: "Monitoring and observability with Prometheus", cost: 165, category: "Cloud & DevOps", duration: "12 hours", instructor: "Mumshad Mannambeth" },
  { _id: "spec-5", title: "Elastic Stack (ELK)", description: "Elasticsearch, Logstash, and Kibana", cost: 170, category: "Cloud & DevOps", duration: "14 hours", instructor: "Frank Kane" },
];

export default function CourseShopPage() {
  const { user, refreshUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"shop" | "my-courses">("shop");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    loadData();
    refreshUser();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      try {
        const [coursesRes, myCoursesRes] = await Promise.all([
          apiGet<{ success: boolean; data: Course[] }>("/shop/courses"),
          apiGet<{ success: boolean; data: Enrollment[] }>("/shop/my-courses"),
        ]);
        
        // Always use PREDEFINED_COURSES to ensure all 146 courses are available
        // If API returns courses, we'll merge them (API courses take precedence for enrolled courses)
        // But we always show the full predefined list
        let finalCourses = [...PREDEFINED_COURSES];
        
        if (coursesRes.success && coursesRes.data && coursesRes.data.length > 0) {
          // Create a map of API courses by ID for quick lookup
          const apiCoursesMap = new Map(coursesRes.data.map((c: Course) => [c._id, c]));
          
          // Replace predefined courses with API versions if they exist (for enrolled courses)
          finalCourses = PREDEFINED_COURSES.map((predefinedCourse) => {
            const apiCourse = apiCoursesMap.get(predefinedCourse._id);
            return apiCourse || predefinedCourse;
          });
          
          // Add any API courses that aren't in predefined list (shouldn't happen, but just in case)
          const predefinedIds = new Set(PREDEFINED_COURSES.map((c) => c._id));
          const additionalApiCourses = coursesRes.data.filter((c: Course) => !predefinedIds.has(c._id));
          if (additionalApiCourses.length > 0) {
            finalCourses = [...finalCourses, ...additionalApiCourses];
          }
        }
        
        setCourses(finalCourses);
        
        if (myCoursesRes.success) {
          setMyCourses(myCoursesRes.data || []);
        }
      } catch {
        // On error, use predefined courses
        setCourses(PREDEFINED_COURSES);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll(courseId: string) {
    try {
      setError("");
      // Find the course data from predefined courses or loaded courses
      const courseData = courses.find((c) => c._id === courseId);
      
      if (!courseData) {
        setError("Course data not found. Please refresh the page.");
        return;
      }
      
      // Always send course data for predefined courses (those with string IDs like "web-1")
      // Check if it's a predefined course (not a MongoDB ObjectId format)
      const isPredefinedCourse = !/^[0-9a-fA-F]{24}$/.test(courseId);
      const payload = isPredefinedCourse ? { courseData } : {};
      
      console.log("Enrolling in course:", { courseId, isPredefinedCourse, hasCourseData: !!courseData });
      
      const response = await apiPost(`/shop/courses/${courseId}/enroll`, payload);
      if (response) {
        await loadData();
        await refreshUser(); // Refresh user to update gold
        // Clear any previous errors on success
        setError("");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to enroll";
      setError(errorMessage);
      console.error("Enrollment error:", err);
    }
  }

  async function handleComplete(courseId: string) {
    try {
      setError("");
      await apiPatch(`/shop/courses/${courseId}/complete`, {});
      await loadData();
      await refreshUser(); // Refresh user to update completed courses
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete course");
    }
  }

  const studentGold = (user as any)?.gold || 0;
  const categories = Array.from(new Set(courses.map((c) => c.category)));

  const filteredCourses = courses.filter((course) => {
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase()) && !course.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedCategory && course.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading courses…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-page">
      <div className="browse-inner">
        {/* Header */}
        <header className="browse-header">
          <div className="browse-title-wrap">
            <div className="browse-eyebrow">Course Shop</div>
            <h1 className="browse-title">Enhance your skills with professional courses</h1>
            <p className="browse-subtitle">Earn gold from completed tasks to enroll in courses</p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Your Gold</div>
              <div className="browse-stat-value">{studentGold}</div>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && <div className="browse-alert" style={{ marginTop: "16px" }}>{error}</div>}

        {/* Tabs */}
        <section className="browse-panel" style={{ marginTop: "16px", padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)" }}>
            <button
              onClick={() => setActiveTab("shop")}
              style={{
                padding: "12px 20px",
                fontSize: "13px",
                fontWeight: "700",
                background: activeTab === "shop" ? "rgba(255,255,255,.08)" : "transparent",
                borderBottom: activeTab === "shop" ? "2px solid var(--primary)" : "2px solid transparent",
                color: activeTab === "shop" ? "var(--text)" : "var(--muted)",
                cursor: "pointer",
                transition: "all 160ms ease",
              }}
            >
              Browse Courses ({courses.length})
            </button>
            <button
              onClick={() => setActiveTab("my-courses")}
              style={{
                padding: "12px 20px",
                fontSize: "13px",
                fontWeight: "700",
                background: activeTab === "my-courses" ? "rgba(255,255,255,.08)" : "transparent",
                borderBottom: activeTab === "my-courses" ? "2px solid var(--primary)" : "2px solid transparent",
                color: activeTab === "my-courses" ? "var(--text)" : "var(--muted)",
                cursor: "pointer",
                transition: "all 160ms ease",
              }}
            >
              My Courses ({myCourses.length})
            </button>
          </div>
        </section>

        {/* Shop Tab */}
        {activeTab === "shop" && (
          <div style={{ marginTop: "16px" }}>
            {/* Search and Filter */}
            <section className="browse-panel">
              <div className="browse-search-row">
                <div className="browse-field">
                  <label className="browse-label">Search</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="browse-input"
                    placeholder="Search courses..."
                  />
                </div>
              </div>
              <div className="browse-field">
                <label className="browse-label">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="browse-select"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Courses Grid */}
            <section className="browse-results" style={{ marginTop: "16px" }}>
              <div className="browse-results-head">
                <h2 className="browse-results-title">Available Courses</h2>
                <div className="browse-results-count">{filteredCourses.length} found</div>
              </div>

              {filteredCourses.length === 0 ? (
                <div className="browse-empty">
                  <div className="browse-empty-title">No courses found</div>
                  <div className="browse-empty-sub">Try adjusting your search or filters.</div>
                </div>
              ) : (
                <div className="browse-cards">
                  {filteredCourses.map((course) => {
                    const isEnrolled = myCourses.some((e) => e.courseId._id === course._id);
                    const canAfford = studentGold >= course.cost;

                    return (
                      <article key={course._id} className="job-card">
                        <div className="job-card-top">
                          <div className="job-card-main">
                            <div className="job-title">{course.title}</div>
                            <div className="job-sub">
                              {course.category} · <span className="job-loc">{course.duration}</span>
                            </div>
                          </div>
                          <div className="job-badges">
                            <span className="badge badge--gold">{course.cost} Gold</span>
                            {course.instructor && (
                              <span className="badge badge--muted">{course.instructor}</span>
                            )}
                          </div>
                        </div>

                        <div style={{ marginTop: "12px", fontSize: "13px", color: "rgba(255,255,255,.85)", lineHeight: "1.5" }}>
                          {course.description}
                        </div>

                        <div className="job-card-bottom">
                          <div className="job-meta">
                            <span className="meta-dot" />
                            {course.duration}
                          </div>
                          {isEnrolled ? (
                            <span className="badge" style={{ background: "rgba(34,197,94,.16)", borderColor: "rgba(34,197,94,.35)", color: "rgba(34,197,94,.9)" }}>
                              Enrolled
                            </span>
                          ) : (
                            <button
                              onClick={() => handleEnroll(course._id)}
                              disabled={!canAfford}
                              className="browse-btn browse-btn--primary"
                              style={{ opacity: !canAfford ? 0.5 : 1, fontSize: "12px", padding: "8px 14px" }}
                            >
                              {canAfford ? "Buy Course →" : "Insufficient Gold"}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* My Courses Tab */}
        {activeTab === "my-courses" && (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">My Courses</h2>
              <div className="browse-results-count">{myCourses.length} enrolled</div>
            </div>

            {myCourses.length === 0 ? (
              <div className="browse-empty">
                <div className="browse-empty-title">No Enrolled Courses</div>
                <div className="browse-empty-sub">You haven't enrolled in any courses yet.</div>
              </div>
            ) : (
              <div className="browse-cards">
                {myCourses.map((enrollment) => {
                  const course = enrollment.courseId as any;
                  const isCompleted = enrollment.completedAt !== undefined;

                  return (
                    <article key={enrollment._id} className="job-card">
                      <div className="job-card-top">
                        <div className="job-card-main">
                          <div className="job-title">{course.title}</div>
                          <div className="job-sub">
                            {course.category} · <span className="job-loc">{course.duration}</span>
                          </div>
                        </div>
                        <div className="job-badges">
                          {isCompleted && (
                            <span className="badge" style={{ background: "rgba(34,197,94,.16)", borderColor: "rgba(34,197,94,.35)", color: "rgba(34,197,94,.9)" }}>
                              Completed
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: "12px", fontSize: "13px", color: "rgba(255,255,255,.85)", lineHeight: "1.5", marginBottom: "12px" }}>
                        {course.description}
                      </div>

                      <div style={{ marginTop: "12px", marginBottom: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Progress</span>
                          <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: "600" }}>
                            {enrollment.progress}%
                          </span>
                        </div>
                        <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,.1)", borderRadius: "999px", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              background: "linear-gradient(135deg, var(--primary), var(--blue))",
                              borderRadius: "999px",
                              width: `${enrollment.progress}%`,
                              transition: "width 300ms ease",
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "12px" }}>
                        Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        {isCompleted && ` · Completed ${new Date(enrollment.completedAt!).toLocaleDateString()}`}
                      </div>

                      <div className="job-card-bottom">
                        <div className="job-meta">
                          <span className="meta-dot" />
                          {isCompleted ? "Course completed" : "In progress"}
                        </div>
                        {!isCompleted && (
                          <button
                            onClick={() => handleComplete(course._id)}
                            className="browse-btn browse-btn--primary"
                            style={{ fontSize: "12px", padding: "8px 14px" }}
                          >
                            Mark Complete →
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";

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
    // Refresh user data to get latest gold balance
    refreshUser();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      // Try to load from API, but fallback to predefined courses
      try {
        const [coursesRes, myCoursesRes] = await Promise.all([
          apiGet<{ success: boolean; data: Course[] }>("/shop/courses"),
          apiGet<{ success: boolean; data: Enrollment[] }>("/shop/my-courses"),
        ]);
        if (coursesRes.success && coursesRes.data && coursesRes.data.length > 0) {
          setCourses(coursesRes.data);
        } else {
          setCourses(PREDEFINED_COURSES);
        }
        if (myCoursesRes.success) {
          setMyCourses(myCoursesRes.data || []);
        }
      } catch {
        // Fallback to predefined courses if API fails
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
      await apiPost(`/shop/courses/${courseId}/enroll`, {});
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll");
    }
  }

  async function handleComplete(courseId: string) {
    try {
      setError("");
      await apiPatch(`/shop/courses/${courseId}/complete`, {});
      await loadData();
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
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading courses…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#111827] mb-2">Course Shop</h1>
            <p className="text-sm text-[#6b7280]">
              Enhance your skills with professional courses. Earn gold from completed tasks to enroll.
            </p>
          </div>
          <div className="text-right border border-[#e5e7eb] rounded-lg bg-white px-4 py-3">
            <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-1">Your Gold</div>
            <div className="text-2xl font-bold text-[#111827]">{studentGold}</div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-[#fecaca] bg-[#fee2e2] rounded-lg px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#e5e7eb]">
        <button
          onClick={() => setActiveTab("shop")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "shop"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent text-[#6b7280] hover:text-[#111827]"
          }`}
        >
          Browse Courses ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab("my-courses")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "my-courses"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent text-[#6b7280] hover:text-[#111827]"
          }`}
        >
          My Courses ({myCourses.length})
        </button>
      </div>

      {/* Shop Tab */}
      {activeTab === "shop" && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="flex-1 px-4 py-2 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-[#d1d5db] rounded-lg text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Courses Table */}
          <div className="border border-[#e5e7eb] rounded-lg bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">Instructor</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#374151] uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-[#374151] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#6b7280]">
                        No courses found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((course) => {
                      const isEnrolled = myCourses.some((e) => e.courseId._id === course._id);
                      const canAfford = studentGold >= course.cost;

                      return (
                        <tr key={course._id} className="hover:bg-[#f9fafb] transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-[#111827]">{course.title}</div>
                            <div className="text-xs text-[#6b7280] mt-1 line-clamp-1">{course.description}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded bg-[#f9fafb] text-xs text-[#374151] border border-[#e5e7eb]">
                              {course.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#6b7280]">{course.duration}</td>
                          <td className="px-6 py-4 text-sm text-[#6b7280]">{course.instructor || "N/A"}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-sm font-bold text-[#111827]">{course.cost} gold</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isEnrolled ? (
                              <span className="text-xs font-medium text-[#6b7280]">Enrolled</span>
                            ) : (
                              <button
                                onClick={() => handleEnroll(course._id)}
                                disabled={!canAfford}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                  canAfford
                                    ? "bg-[#111827] text-white hover:bg-[#1f2937]"
                                    : "bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed"
                                }`}
                              >
                                Buy
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* My Courses Tab */}
      {activeTab === "my-courses" && (
        <div className="space-y-6">
          {myCourses.length === 0 ? (
            <div className="text-center py-12 border border-[#e5e7eb] rounded-lg bg-white">
              <p className="text-sm text-[#6b7280]">You haven't enrolled in any courses yet.</p>
            </div>
          ) : (
            myCourses.map((enrollment) => {
              const course = enrollment.courseId as any;
              const isCompleted = enrollment.completedAt !== undefined;

              return (
                <div
                  key={enrollment._id}
                  className="border border-[#e5e7eb] rounded-lg bg-white p-6"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-[#111827]">
                          {course.title}
                        </h3>
                        {isCompleted && (
                          <span className="rounded-full bg-[#d1fae5] text-[#065f46] px-2.5 py-1 text-xs font-medium border border-[#a7f3d0]">
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#6b7280] mb-4">
                        {course.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[#9ca3af] mb-4">
                        <span>Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                        {isCompleted && (
                          <span>
                            Completed {new Date(enrollment.completedAt!).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-[#f3f4f6] rounded-full h-2 mb-1">
                        <div
                          className="bg-[#111827] h-2 rounded-full transition-all"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {enrollment.progress}% complete
                      </div>
                    </div>
                    {!isCompleted && (
                      <button
                        onClick={() => handleComplete(course._id)}
                        className="rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f2937] whitespace-nowrap flex-shrink-0"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

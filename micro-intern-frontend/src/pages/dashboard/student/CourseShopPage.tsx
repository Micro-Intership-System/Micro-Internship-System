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

export default function CourseShopPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"shop" | "my-courses">("shop");
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [coursesRes, myCoursesRes] = await Promise.all([
        apiGet<{ success: boolean; data: Course[] }>("/shop/courses"),
        apiGet<{ success: boolean; data: Enrollment[] }>("/shop/my-courses"),
      ]);
      setCourses(coursesRes.data);
      setMyCourses(myCoursesRes.data);
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

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-sm text-slate-600">Loading courses…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Course Shop
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Enhance your skills with professional courses. Earn gold from completed tasks to enroll.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Your Gold</div>
          <div className="text-2xl font-bold text-slate-900">{studentGold} 🪙</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("shop")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "shop"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Browse Courses
        </button>
        <button
          onClick={() => setActiveTab("my-courses")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "my-courses"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          My Courses ({myCourses.length})
        </button>
      </div>

      {/* Shop Tab */}
      {activeTab === "shop" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length === 0 ? (
            <div className="col-span-full text-center py-12 text-sm text-slate-600">
              No courses available at the moment.
            </div>
          ) : (
            courses.map((course) => {
              const isEnrolled = myCourses.some(
                (e) => e.courseId._id === course._id
              );
              const canAfford = studentGold >= course.cost;

              return (
                <div
                  key={course._id}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
                >
                  {course.thumbnailUrl && (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-5 space-y-3">
                    <div>
                      <div className="text-xs font-medium text-slate-500 mb-1">
                        {course.category}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {course.title}
                      </h3>
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-2">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>⏱ {course.duration}</span>
                      {course.instructor && <span>👤 {course.instructor}</span>}
                    </div>

                    {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                      <div className="text-xs">
                        <div className="font-medium text-slate-700 mb-1">
                          You'll learn:
                        </div>
                        <ul className="text-slate-600 space-y-0.5">
                          {course.learningOutcomes.slice(0, 3).map((outcome, i) => (
                            <li key={i}>• {outcome}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="text-lg font-bold text-slate-900">
                        {course.cost} 🪙
                      </div>
                      {isEnrolled ? (
                        <span className="text-xs font-medium text-slate-600">
                          Enrolled
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course._id)}
                          disabled={!canAfford}
                          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                            canAfford
                              ? "bg-slate-900 text-white hover:bg-black"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          Enroll
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* My Courses Tab */}
      {activeTab === "my-courses" && (
        <div className="space-y-4">
          {myCourses.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-600">
              You haven't enrolled in any courses yet.
            </div>
          ) : (
            myCourses.map((enrollment) => {
              const course = enrollment.courseId as any;
              const isCompleted = enrollment.completedAt !== undefined;

              return (
                <div
                  key={enrollment._id}
                  className="rounded-xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {course.title}
                        </h3>
                        {isCompleted && (
                          <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        {course.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                        <span>Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                        {isCompleted && (
                          <span>
                            Completed {new Date(enrollment.completedAt!).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-slate-900 h-2 rounded-full transition-all"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {enrollment.progress}% complete
                      </div>
                    </div>
                    {!isCompleted && (
                      <button
                        onClick={() => handleComplete(course._id)}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black whitespace-nowrap"
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


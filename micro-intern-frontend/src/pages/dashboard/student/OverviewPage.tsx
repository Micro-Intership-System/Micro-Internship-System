import { useAuth } from "../../../context/AuthContext";

const OverviewPage = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">
        Welcome back, {user?.name} 👋
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Here’s what’s happening with your micro-internships.
      </p>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">Active Applications</p>
          <p className="text-2xl font-semibold">3</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">Saved Jobs</p>
          <p className="text-2xl font-semibold">5</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">Completed</p>
          <p className="text-2xl font-semibold">1</p>
        </div>

      </div>

    </div>
  );
};

export default OverviewPage;

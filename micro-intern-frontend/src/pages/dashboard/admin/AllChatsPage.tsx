import { useEffect, useState } from "react";
import { apiGet } from "../../../api/client";

type Task = {
  _id: string;
  title: string;
  companyName: string;
  status: string;
  employerId: { _id: string; name: string; email: string };
  acceptedStudentId?: { _id: string; name: string; email: string };
};

type ChatMessage = {
  _id: string;
  taskId: string;
  senderId: { _id: string; name: string; email: string };
  text: string;
  createdAt: string;
  status: string;
};

export default function AllChatsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (selectedTaskId) {
      loadMessages(selectedTaskId);
      const interval = setInterval(() => {
        loadMessages(selectedTaskId);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedTaskId]);

  async function loadTasks() {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: Task[] }>("/internships");
      if (res.success) {
        // Filter tasks that have accepted students (active chats)
        const activeTasks = res.data.filter(
          (task: any) => task.acceptedStudentId && (task.status === "in_progress" || task.status === "posted")
        );
        setTasks(activeTasks);
        if (activeTasks.length > 0 && !selectedTaskId) {
          setSelectedTaskId(activeTasks[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(taskId: string) {
    try {
      const res = await apiGet<{ success: boolean; data: ChatMessage[] }>(`/task-chat/${taskId}`);
      if (res.success) {
        setMessages(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTask = tasks.find((t) => t._id === selectedTaskId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading chats…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-semibold text-[#111827] mb-3">All Chats</h1>
        <p className="text-sm text-[#6b7280] max-w-2xl mx-auto">
          Monitor all active task conversations between students and employers. Admin access to all chats for moderation.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-16 text-center">
          <p className="text-sm text-[#6b7280]">No active chats found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Task List */}
          <div className="lg:col-span-1 border border-[#e5e7eb] rounded-lg bg-white overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#e5e7eb]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-xs text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827]"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredTasks.map((task) => (
                <button
                  key={task._id}
                  onClick={() => setSelectedTaskId(task._id)}
                  className={`w-full text-left p-4 border-b border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors ${
                    selectedTaskId === task._id ? "bg-[#f9fafb]" : ""
                  }`}
                >
                  <div className="font-semibold text-sm text-[#111827] mb-1">{task.title}</div>
                  <div className="text-xs text-[#6b7280]">{task.companyName}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 border border-[#e5e7eb] rounded-lg bg-white flex flex-col">
            {selectedTask ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-[#e5e7eb]">
                  <div className="font-semibold text-sm text-[#111827] mb-1">{selectedTask.title}</div>
                  <div className="text-xs text-[#6b7280] space-y-1">
                    <div>Company: {selectedTask.companyName}</div>
                    <div>Employer: {selectedTask.employerId.name}</div>
                    {selectedTask.acceptedStudentId && (
                      <div>Student: {selectedTask.acceptedStudentId.name}</div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-sm text-[#6b7280] py-8">
                      No messages yet
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg._id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#111827] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {msg.senderId.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-[#6b7280] mb-1">
                            {msg.senderId.name} • {new Date(msg.createdAt).toLocaleTimeString()}
                          </div>
                          <div className="inline-block px-4 py-2 rounded-lg text-sm bg-[#f9fafb] text-[#111827] border border-[#e5e7eb]">
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-[#6b7280]">
                Select a task to view messages
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



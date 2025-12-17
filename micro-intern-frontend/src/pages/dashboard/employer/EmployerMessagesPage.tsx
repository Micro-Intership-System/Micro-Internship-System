import { useEffect, useState, useRef } from "react";
import { apiGet, apiPost } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";

type TaskChatMessage = {
  _id: string;
  taskId: {
    _id: string;
    title: string;
    companyName: string;
  };
  senderId: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  text: string;
  attachments?: string[];
  createdAt: string;
  status: "active" | "deleted" | "moderated";
};

type Task = {
  _id: string;
  title: string;
  companyName: string;
  status: string;
  acceptedStudentId?: string;
};

export default function EmployerMessagesPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TaskChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (selectedTaskId) {
      loadMessages(selectedTaskId);
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        loadMessages(selectedTaskId);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedTaskId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadTasks() {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: any[] }>("/employer/jobs");
      if (res.success) {
        // Get all tasks with accepted students (including completed for dispute chats)
        const activeTasks = res.data
          .filter((task: any) => task.acceptedStudentId && task.status !== "cancelled")
          .map((task: any) => ({
            _id: task._id,
            title: task.title,
            companyName: task.companyName || "My Company",
            status: task.status,
            acceptedStudentId: task.acceptedStudentId,
            submissionStatus: task.submissionStatus,
          }));
        setTasks(activeTasks);
        
        // Check URL for taskId parameter
        const urlParams = new URLSearchParams(window.location.search);
        const taskIdParam = urlParams.get("taskId");
        
        if (taskIdParam && activeTasks.find((t: any) => t._id === taskIdParam)) {
          setSelectedTaskId(taskIdParam);
        } else if (activeTasks.length > 0 && !selectedTaskId) {
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
      const res = await apiGet<{ success: boolean; data: TaskChatMessage[] }>(
        `/task-chat/${taskId}`
      );
      if (res.success) {
        setMessages(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }

  async function sendMessage() {
    if (!selectedTaskId || !newMessage.trim()) return;

    try {
      setSending(true);
      await apiPost(`/task-chat/${selectedTaskId}`, {
        text: newMessage.trim(),
      });
      setNewMessage("");
      await loadMessages(selectedTaskId);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const selectedTask = tasks.find((t) => t._id === selectedTaskId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading messages…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">Messages</h1>
        <p className="text-sm text-[#6b7280]">Chat with students about active tasks</p>
      </div>

      {tasks.length === 0 ? (
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-16 text-center">
          <h3 className="text-lg font-semibold text-[#111827] mb-2">No Active Tasks</h3>
          <p className="text-sm text-[#6b7280] mb-6">
            You need to have tasks with accepted students to start chatting.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Task List */}
          <div className="lg:col-span-1 border border-[#e5e7eb] rounded-lg bg-white overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#e5e7eb]">
              <h2 className="text-sm font-semibold text-[#111827]">Active Tasks</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {tasks.map((task) => (
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
                  <div className="font-semibold text-sm text-[#111827]">{selectedTask.title}</div>
                  <div className="text-xs text-[#6b7280]">{selectedTask.companyName}</div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-sm text-[#6b7280] py-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.senderId._id === user?.id;
                      return (
                        <div
                          key={msg._id}
                          className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                        >
                          <div className={`w-8 h-8 rounded-full bg-[#111827] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                            {msg.senderId.name.charAt(0).toUpperCase()}
                          </div>
                          <div className={`flex-1 ${isOwn ? "text-right" : ""}`}>
                            <div className="text-xs text-[#6b7280] mb-1">
                              {msg.senderId.name} • {new Date(msg.createdAt).toLocaleTimeString()}
                            </div>
                            <div
                              className={`inline-block px-4 py-2 rounded-lg text-sm ${
                                isOwn
                                  ? "bg-[#111827] text-white"
                                  : "bg-[#f9fafb] text-[#111827] border border-[#e5e7eb]"
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-[#e5e7eb]">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="px-6 py-2 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </form>
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


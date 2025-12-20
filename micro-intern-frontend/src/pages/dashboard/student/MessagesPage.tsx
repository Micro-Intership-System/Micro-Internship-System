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

import "./css/StudentMessagesPage.css";

export default function MessagesPage() {
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
      // Load all running jobs (accepted jobs)
      const res = await apiGet<{ success: boolean; data: any[] }>("/jobs/running");
      if (res.success) {
        const runningTasks = res.data.map((job: any) => ({
          _id: job._id,
          title: job.title,
          companyName: job.companyName,
          status: job.status,
          acceptedStudentId: user?.id,
        }));
        setTasks(runningTasks);
        
        // Check URL for taskId parameter
        const urlParams = new URLSearchParams(window.location.search);
        const taskIdParam = urlParams.get("taskId");
        
        if (taskIdParam && runningTasks.find((t: any) => t._id === taskIdParam)) {
          setSelectedTaskId(taskIdParam);
        } else if (runningTasks.length > 0 && !selectedTaskId) {
          setSelectedTaskId(runningTasks[0]._id);
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
    <div className="messagesPage space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="messagesPage__title">Messages</h1>
        <p className="messagesPage__subtitle">Chat with employers about your active tasks</p>
      </div>

      {tasks.length === 0 ? (
        <div className="messagesPage__panel p-16 text-center">
          <h3 className="messagesPage__heading">No Active Tasks</h3>
          <p className="messagesPage__muted mb-6">
            You need to have an accepted application to start chatting.
          </p>
        </div>
      ) : (
        <div className="messagesPage__grid h-[600px]">
          {/* Task List */}
          <div className="messagesPage__panel lg:col-span-1 overflow-hidden flex flex-col">
            <div className="messagesPage__panelHead">
              <h2 className="messagesPage__panelTitle">Active Tasks</h2>
            </div>
            <div className="messagesPage__list">
              {tasks.map((task) => (
                <button
                  key={task._id}
                  onClick={() => setSelectedTaskId(task._id)}
                  className={`messagesPage__taskBtn ${selectedTaskId === task._id ? "is-active" : ""}`}
                >
                  <div className="messagesPage__taskTitle">{task.title}</div>
                  <div className="messagesPage__taskCompany">{task.companyName}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="messagesPage__panel lg:col-span-2 flex flex-col">
            {selectedTask ? (
              <>
                {/* Chat Header */}
                <div className="messagesPage__panelHead">
                  <div className="messagesPage__panelTitle">{selectedTask.title}</div>
                  <div className="messagesPage__panelSubtitle">{selectedTask.companyName}</div>
                </div>

                {/* Messages */}
                <div className="messagesPage__messages">
                  {messages.length === 0 ? (
                    <div className="messagesPage__empty">No messages yet. Start the conversation!</div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.senderId._id === user?.id;
                      return (
                        <div key={msg._id} className={`messagesPage__msgRow ${isOwn ? "own" : ""}`}>
                          <div className="messagesPage__avatar">{msg.senderId.name.charAt(0).toUpperCase()}</div>
                          <div className={`messagesPage__msgBody ${isOwn ? "own" : ""}`}>
                            <div className="messagesPage__meta">{msg.senderId.name} • {new Date(msg.createdAt).toLocaleTimeString()}</div>
                            <div className={`messagesPage__bubble ${isOwn ? "messagesPage__bubble--own" : "messagesPage__bubble--other"}`}>
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
                <div className="messagesPage__inputWrap">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="messagesPage__form"
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="messagesPage__input"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="messagesPage__sendBtn"
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="messagesPage__selectTask">Select a task to view messages</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

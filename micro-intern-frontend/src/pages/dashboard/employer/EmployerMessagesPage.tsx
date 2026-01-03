import { useEffect, useState, useRef } from "react";
import { apiGet, apiPost } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import "./css/EmployerMessagesPage.css";

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
  submissionStatus?: string;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedTaskId) return;

    loadMessages(selectedTaskId);

    const interval = window.setInterval(() => {
      loadMessages(selectedTaskId);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [selectedTaskId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadTasks() {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: any[] }>("/employer/jobs");
      if (!res.success) return;

      const activeTasks: Task[] = res.data
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

      const urlParams = new URLSearchParams(window.location.search);
      const taskIdParam = urlParams.get("taskId");

      if (taskIdParam && activeTasks.some((t) => t._id === taskIdParam)) {
        setSelectedTaskId(taskIdParam);
      } else if (activeTasks.length > 0) {
        setSelectedTaskId((prev) => prev ?? activeTasks[0]._id);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(taskId: string) {
    try {
      const res = await apiGet<{ success: boolean; data: TaskChatMessage[] }>(`/task-chat/${taskId}`);
      if (res.success) setMessages(res.data || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }

  async function sendMessage() {
    if (!selectedTaskId || !newMessage.trim()) return;

    try {
      setSending(true);
      await apiPost(`/task-chat/${selectedTaskId}`, { text: newMessage.trim() });
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
      <div className="empMsg__loadingWrap">
        <div className="empMsg__loadingText">Loading messages…</div>
      </div>
    );
  }

  return (
    <div className="empMsg">
      {/* Page Header */}
      <div className="empMsg__header">
        <h1 className="empMsg__title">Messages</h1>
        <p className="empMsg__subtitle">Chat with students about active tasks</p>
      </div>

      {tasks.length === 0 ? (
        <div className="empMsg__empty">
          <h3 className="empMsg__emptyTitle">No Active Tasks</h3>
          <p className="empMsg__emptyText">
            You need to have tasks with accepted students to start chatting.
          </p>
        </div>
      ) : (
        <div className="empMsg__grid">
          {/* Task List */}
          <div className="empMsg__panel">
            <div className="empMsg__panelHeader">
              <h2 className="empMsg__panelHeaderTitle">Active Tasks</h2>
            </div>

            <div className="empMsg__taskList">
              {tasks.map((task) => (
                <button
                  key={task._id}
                  onClick={() => setSelectedTaskId(task._id)}
                  className={[
                    "empMsg__taskBtn",
                    selectedTaskId === task._id ? "empMsg__taskBtn--active" : "",
                  ].join(" ")}
                >
                  <div className="empMsg__taskTitle">{task.title}</div>
                  <div className="empMsg__taskCompany">{task.companyName}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="empMsg__panel">
            {selectedTask ? (
              <>
                {/* Chat Header */}
                <div className="empMsg__panelHeader">
                  <div className="empMsg__panelHeaderTitle">{selectedTask.title}</div>
                  <div className="empMsg__panelHeaderSub">{selectedTask.companyName}</div>
                </div>

                {/* Messages */}
                <div className="empMsg__chat">
                  {messages.length === 0 ? (
                    <div className="empMsg__noMessages">No messages yet. Start the conversation!</div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.senderId._id === user?.id;
                      return (
                        <div
                          key={msg._id}
                          className={[
                            "empMsg__msgRow",
                            isOwn ? "empMsg__msgRow--own" : "",
                          ].join(" ")}
                        >
                          <div className="empMsg__avatar">
                            {msg.senderId.name.charAt(0).toUpperCase()}
                          </div>

                          <div className={isOwn ? "empMsg__msgBody empMsg__msgBody--own" : "empMsg__msgBody"}>
                            <div className="empMsg__meta">
                              {msg.senderId.name} •{" "}
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </div>

                            <div
                              className={[
                                "empMsg__bubble",
                                isOwn ? "empMsg__bubble--own" : "empMsg__bubble--other",
                              ].join(" ")}
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
                <div className="empMsg__inputWrap">
                  <form
                    className="empMsg__form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="empMsg__input"
                      disabled={sending}
                    />

                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="empMsg__sendBtn"
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="empMsg__selectTask">Select a task to view messages</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

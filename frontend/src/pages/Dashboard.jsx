import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tasksAPI } from '../api';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [inputText, setInputText] = useState('');
  const [operation, setOperation] = useState('uppercase');
  const [creating, setCreating] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      const res = await tasksAPI.list({ limit: 50 });
      setTasks(res.data.data.tasks);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await tasksAPI.create({ title, inputText, operation });
      setShowCreate(false);
      setTitle('');
      setInputText('');
      setOperation('uppercase');
      fetchTasks();
    } catch (err) {
      alert('Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const statusColors = {
    pending: '#f5a623',
    running: '#0070f3',
    success: '#28a745',
    failed: '#dc3545'
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>AI Task Platform</h1>
        <div style={styles.userMenu}>
          <span>Welcome, {user?.name}</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <div style={styles.content}>
        <div style={styles.toolbar}>
          <h2>Tasks</h2>
          <button onClick={() => setShowCreate(true)} style={styles.createBtn}>
            + New Task
          </button>
        </div>

        {showCreate && (
          <div style={styles.createForm}>
            <h3>Create New Task</h3>
            <form onSubmit={handleCreate}>
              <div style={styles.formField}>
                <label>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formField}>
                <label>Operation</label>
                <select
                  value={operation}
                  onChange={(e) => setOperation(e.target.value)}
                  style={styles.select}
                >
                  <option value="uppercase">Uppercase</option>
                  <option value="lowercase">Lowercase</option>
                  <option value="reverse">Reverse String</option>
                  <option value="word_count">Word Count</option>
                </select>
              </div>
              <div style={styles.formField}>
                <label>Input Text</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  required
                  rows={4}
                  style={styles.textarea}
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowCreate(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={creating} style={styles.submitBtn}>
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p style={styles.empty}>No tasks yet. Create your first task!</p>
        ) : (
          <div style={styles.taskList}>
            {tasks.map((task) => (
              <div
                key={task._id}
                style={styles.taskCard}
                onClick={() => navigate(`/tasks/${task._id}`)}
              >
                <div style={styles.taskHeader}>
                  <span style={styles.taskTitle}>{task.title}</span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      background: statusColors[task.status]
                    }}
                  >
                    {task.status}
                  </span>
                </div>
                <div style={styles.taskMeta}>
                  <span>Operation: {task.operation}</span>
                  <span>{new Date(task.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  header: {
    background: 'white',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '20px',
    fontWeight: 600
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  logoutBtn: {
    background: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  content: {
    maxWidth: '900px',
    margin: '24px auto',
    padding: '0 20px'
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  createBtn: {
    background: '#0070f3',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  createForm: {
    background: 'white',
    padding: '24px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  formField: {
    marginBottom: '16px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    resize: 'vertical'
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  cancelBtn: {
    background: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  submitBtn: {
    background: '#0070f3',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    padding: '40px'
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  taskCard: {
    background: 'white',
    padding: '16px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  taskTitle: {
    fontWeight: 600,
    fontSize: '16px'
  },
  statusBadge: {
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500
  },
  taskMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#666'
  }
};

export default Dashboard;

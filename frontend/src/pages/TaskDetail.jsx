import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tasksAPI } from '../api';

const TaskDetail = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTask = async () => {
    try {
      const res = await tasksAPI.get(id);
      setTask(res.data.data.task);
    } catch (err) {
      console.error('Failed to fetch task:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
    const interval = setInterval(fetchTask, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div style={styles.container}>Loading...</div>;

  if (!task) return <div style={styles.container}>Task not found</div>;

  const statusColors = {
    pending: '#f5a623',
    running: '#0070f3',
    success: '#28a745',
    failed: '#dc3545'
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <Link to="/dashboard" style={styles.backLink}>&larr; Back to Dashboard</Link>
      </header>

      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>{task.title}</h1>
            <span
              style={{
                ...styles.statusBadge,
                background: statusColors[task.status]
              }}
            >
              {task.status}
            </span>
          </div>

          <div style={styles.section}>
            <h3>Task Details</h3>
            <div style={styles.detailGrid}>
              <div style={styles.detailItem}>
                <span style={styles.label}>Operation</span>
                <span style={styles.value}>{task.operation}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.label}>Created</span>
                <span style={styles.value}>{new Date(task.createdAt).toLocaleString()}</span>
              </div>
              {task.startedAt && (
                <div style={styles.detailItem}>
                  <span style={styles.label}>Started</span>
                  <span style={styles.value}>{new Date(task.startedAt).toLocaleString()}</span>
                </div>
              )}
              {task.completedAt && (
                <div style={styles.detailItem}>
                  <span style={styles.label}>Completed</span>
                  <span style={styles.value}>{new Date(task.completedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div style={styles.section}>
            <h3>Input Text</h3>
            <pre style={styles.codeBlock}>{task.inputText}</pre>
          </div>

          {task.result && (
            <div style={styles.section}>
              <h3>Result</h3>
              <pre style={{ ...styles.codeBlock, background: '#e8f5e9' }}>{task.result}</pre>
            </div>
          )}

          {task.logs && (
            <div style={styles.section}>
              <h3>Logs</h3>
              <pre style={styles.logsBlock}>{task.logs}</pre>
            </div>
          )}

          {task.error && (
            <div style={styles.section}>
              <h3>Error</h3>
              <div style={styles.errorBlock}>{task.error}</div>
            </div>
          )}
        </div>
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
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  backLink: {
    color: '#0070f3',
    textDecoration: 'none',
    fontWeight: 500
  },
  content: {
    maxWidth: '800px',
    margin: '24px auto',
    padding: '0 20px'
  },
  card: {
    background: 'white',
    padding: '32px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    fontSize: '24px'
  },
  statusBadge: {
    color: 'white',
    padding: '6px 16px',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: 500
  },
  section: {
    marginBottom: '24px'
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  label: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase'
  },
  value: {
    fontSize: '14px',
    fontWeight: 500
  },
  codeBlock: {
    background: '#f5f5f5',
    padding: '16px',
    borderRadius: '4px',
    fontSize: '14px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all'
  },
  logsBlock: {
    background: '#263238',
    color: '#aed581',
    padding: '16px',
    borderRadius: '4px',
    fontSize: '13px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap'
  },
  errorBlock: {
    background: '#ffebee',
    color: '#c62828',
    padding: '16px',
    borderRadius: '4px'
  }
};

export default TaskDetail;

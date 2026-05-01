import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Clock, AlertTriangle, CheckCircle2, ListTodo, Loader2 } from 'lucide-react';
import api from '../api/axios';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then((res) => { setData(res.data.data); }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader"><div className="spinner"></div></div>;
  if (!data) return <div className="empty-state"><h4>Failed to load dashboard</h4></div>;

  const { stats, priorities, myTasks, overdueTasks, recentTasks, projectCount } = data;
  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diff = date - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days}d left`;
  };

  return (
    <>
      <div className="page-header">
        <h2><LayoutDashboard size={22} style={{marginRight:8,verticalAlign:'middle'}} /> Dashboard</h2>
      </div>
      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="label">Total Tasks</div>
            <div className="value">{stats.total}</div>
            <div className="sub">{projectCount} project{projectCount !== 1 ? 's' : ''}</div>
          </div>
          <div className="stat-card warning">
            <div className="label">In Progress</div>
            <div className="value">{stats.in_progress}</div>
            <div className="sub">{stats.review} in review</div>
          </div>
          <div className="stat-card success">
            <div className="label">Completed</div>
            <div className="value">{stats.done}</div>
            <div className="sub">{completionRate}% completion</div>
          </div>
          <div className="stat-card danger">
            <div className="label">Overdue</div>
            <div className="value">{overdueTasks.length}</div>
            <div className="sub">{priorities.urgent} urgent</div>
          </div>
        </div>

        {overdueTasks.length > 0 && (
          <div style={{marginBottom:'2rem'}}>
            <div className="section-title"><AlertTriangle size={18} color="var(--danger)" /> Overdue Tasks</div>
            <div className="task-list">
              {overdueTasks.slice(0, 5).map((t) => (
                <div key={t._id} className="task-list-item" onClick={() => navigate(`/projects/${t.project._id}`)} style={{cursor:'pointer'}}>
                  <span className={`priority-dot ${t.priority}`}></span>
                  <div>
                    <div style={{fontWeight:600,fontSize:'0.9rem'}}>{t.title}</div>
                    <div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>{t.project?.name}</div>
                  </div>
                  <span className={`status-badge ${t.status}`}>{t.status.replace('_',' ')}</span>
                  <span className="task-due overdue">{formatDate(t.dueDate)}</span>
                  <span className="task-assignee">{t.assignee?.name || 'Unassigned'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2rem'}}>
          <div>
            <div className="section-title"><ListTodo size={18} color="var(--accent)" /> My Tasks</div>
            {myTasks.length === 0 ? (
              <div className="empty-state"><p>No tasks assigned to you</p></div>
            ) : (
              <div className="task-list">
                {myTasks.filter(t => t.status !== 'done').slice(0, 8).map((t) => (
                  <div key={t._id} className="task-card" onClick={() => navigate(`/projects/${t.project?._id || t.project}`)}>
                    <h5>{t.title}</h5>
                    <div className="task-footer">
                      <div style={{display:'flex',gap:'0.4rem',alignItems:'center'}}>
                        <span className={`priority-dot ${t.priority}`}></span>
                        <span className={`status-badge ${t.status}`}>{t.status.replace('_',' ')}</span>
                      </div>
                      {t.dueDate && <span className={`task-due ${new Date(t.dueDate) < new Date() ? 'overdue' : ''}`}>{formatDate(t.dueDate)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="section-title"><Clock size={18} color="var(--warning)" /> Recent Activity</div>
            {recentTasks.length === 0 ? (
              <div className="empty-state"><p>No recent activity</p></div>
            ) : (
              <div className="task-list">
                {recentTasks.slice(0, 8).map((t) => (
                  <div key={t._id} className="task-card" onClick={() => navigate(`/projects/${t.project?._id || t.project}`)}>
                    <h5>{t.title}</h5>
                    <div className="task-footer">
                      <span className={`status-badge ${t.status}`}>{t.status.replace('_',' ')}</span>
                      <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>{t.project?.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

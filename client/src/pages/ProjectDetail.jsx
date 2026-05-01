import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Users, Settings, Trash2, Search, UserPlus, Shield, User as UserIcon } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUS_COLS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'In Review' },
  { key: 'done', label: 'Done' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignee: '', priority: 'medium', dueDate: '', status: 'todo' });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.data);
    } catch { navigate('/projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const isAdmin = project?.myRole === 'admin';

  const openNewTask = (status = 'todo') => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', assignee: '', priority: 'medium', dueDate: '', status });
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title, description: task.description || '',
      assignee: task.assignee?._id || task.assignee?.id || '',
      priority: task.priority, dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      status: task.status,
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...taskForm };
      if (!payload.assignee) delete payload.assignee;
      if (!payload.dueDate) payload.dueDate = null;

      if (editingTask) {
        await api.put(`/projects/${id}/tasks/${editingTask._id}`, payload);
        toast.success('Task updated!');
      } else {
        await api.post(`/projects/${id}/tasks`, payload);
        toast.success('Task created!');
      }
      setShowTaskModal(false);
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally { setSaving(false); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/projects/${id}/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchProject();
    } catch (err) { toast.error('Failed to delete task'); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/projects/${id}/tasks/${taskId}`, { status: newStatus });
      fetchProject();
    } catch { toast.error('Failed to update status'); }
  };

  // Member management
  const searchUsers = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/auth/users/search?q=${q}`);
      const memberIds = project.members.map(m => (m.user._id || m.user.id || m.user).toString());
      setSearchResults(res.data.data.filter(u => !memberIds.includes(u.id)));
    } catch { setSearchResults([]); }
  };

  const addMember = async (userId) => {
    try {
      await api.post(`/projects/${id}/members`, { userId, role: 'member' });
      toast.success('Member added!');
      setSearchQuery(''); setSearchResults([]);
      fetchProject();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      toast.success('Member removed');
      fetchProject();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    try {
      await api.put(`/projects/${id}/members/${userId}`, { role: newRole });
      toast.success('Role updated');
      fetchProject();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch { toast.error('Failed to delete project'); }
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (d) => d && new Date(d) < new Date();

  if (loading) return <div className="loader"><div className="spinner"></div></div>;
  if (!project) return null;

  const tasks = project.tasks || [];

  return (
    <>
      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}><ArrowLeft size={18} /></button>
          <div>
            <h2 style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
              <span style={{width:12,height:12,borderRadius:3,background:project.color,display:'inline-block'}}></span>
              {project.name}
            </h2>
          </div>
        </div>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowMembersModal(true)}><Users size={15} /> Members ({project.members.length})</button>
          <button className="btn btn-primary btn-sm" onClick={() => openNewTask()}><Plus size={15} /> Add Task</button>
          {isAdmin && <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}><Trash2 size={15} /></button>}
        </div>
      </div>
      <div className="page-body">
        {project.description && <p style={{color:'var(--text-secondary)',marginBottom:'1.5rem',fontSize:'0.9rem'}}>{project.description}</p>}
        <div className="task-columns">
          {STATUS_COLS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="task-column">
                <div className="task-column-header">
                  <h4>{col.label}</h4>
                  <span className="count">{colTasks.length}</span>
                </div>
                {colTasks.map((t) => (
                  <div key={t._id} className="task-card" onClick={() => openEditTask(t)}>
                    {t.labels?.length > 0 && <div className="task-labels">{t.labels.map((l,i) => <span key={i} className="task-label">{l}</span>)}</div>}
                    <h5>{t.title}</h5>
                    {t.description && <div className="task-desc">{t.description}</div>}
                    <div className="task-footer">
                      <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                        <span className={`priority-dot ${t.priority}`}></span>
                        <span className={`priority-badge ${t.priority}`}>{t.priority}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                        {t.dueDate && <span className={`task-due ${isOverdue(t.dueDate) && t.status !== 'done' ? 'overdue' : ''}`}>{formatDate(t.dueDate)}</span>}
                        <span className="task-assignee">{t.assignee?.name?.split(' ')[0] || '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" style={{width:'100%',marginTop:'0.3rem',justifyContent:'center'}} onClick={() => openNewTask(col.key)}><Plus size={14} /> Add</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTask ? 'Edit Task' : 'New Task'}</h3>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label>Title</label>
                <input placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} placeholder="Details..." value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})} />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <div className="form-group">
                  <label>Status</label>
                  <select value={taskForm.status} onChange={(e) => setTaskForm({...taskForm, status: e.target.value})}>
                    {STATUS_COLS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}>
                    <option value="low">Low</option><option value="medium">Medium</option>
                    <option value="high">High</option><option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <div className="form-group">
                  <label>Assignee</label>
                  <select value={taskForm.assignee} onChange={(e) => setTaskForm({...taskForm, assignee: e.target.value})}>
                    <option value="">Unassigned</option>
                    {project.members.map((m) => <option key={m.user._id || m.user.id} value={m.user._id || m.user.id}>{m.user.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})} />
                </div>
              </div>
              <div className="modal-actions">
                {editingTask && isAdmin && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => { handleDeleteTask(editingTask._id); setShowTaskModal(false); }}>Delete</button>
                )}
                <div style={{flex:1}}></div>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editingTask ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <div className="modal-overlay" onClick={() => setShowMembersModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Team Members</h3>
              <button className="modal-close" onClick={() => setShowMembersModal(false)}><X size={20} /></button>
            </div>
            {isAdmin && (
              <div style={{marginBottom:'1rem',position:'relative'}}>
                <div className="search-bar">
                  <Search size={16} />
                  <input placeholder="Search users by name or email..." value={searchQuery} onChange={(e) => searchUsers(e.target.value)} />
                </div>
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map(u => (
                      <div key={u.id} className="search-result-item" onClick={() => addMember(u.id)}>
                        <div style={{fontWeight:600,fontSize:'0.85rem'}}>{u.name}</div>
                        <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{u.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="members-list">
              {project.members.map((m) => {
                const uid = m.user._id || m.user.id;
                const isOwner = project.owner === uid || project.owner?._id === uid;
                return (
                  <div key={uid} className="member-row">
                    <div className="user-avatar">{m.user.name?.[0]?.toUpperCase()}</div>
                    <div>
                      <div className="name">{m.user.name} {isOwner && <span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>(Owner)</span>}</div>
                      <div className="email">{m.user.email}</div>
                    </div>
                    <div className="member-actions">
                      <span className={`role-badge ${m.role}`}>{m.role}</span>
                      {isAdmin && !isOwner && (
                        <>
                          <button className="btn btn-ghost btn-sm" title="Toggle role" onClick={() => toggleRole(uid, m.role)}>
                            {m.role === 'admin' ? <UserIcon size={14} /> : <Shield size={14} />}
                          </button>
                          <button className="btn btn-ghost btn-sm" title="Remove" onClick={() => removeMember(uid)}>
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

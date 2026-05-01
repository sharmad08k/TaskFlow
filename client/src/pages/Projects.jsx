import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, Users, CheckCircle2, X } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const colors = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f59e0b','#10b981','#3b82f6','#06b6d4'];

  const fetchProjects = () => {
    api.get('/projects').then((r) => setProjects(r.data.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created!');
      setShowModal(false);
      setForm({ name: '', description: '', color: '#6366f1' });
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="loader"><div className="spinner"></div></div>;

  return (
    <>
      <div className="page-header">
        <h2><FolderKanban size={22} style={{marginRight:8,verticalAlign:'middle'}} /> Projects</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Project</button>
      </div>
      <div className="page-body">
        {projects.length === 0 ? (
          <div className="empty-state">
            <FolderKanban size={48} />
            <h4>No projects yet</h4>
            <p>Create your first project to get started</p>
            <button className="btn btn-primary" style={{marginTop:'1rem'}} onClick={() => setShowModal(true)}>Create Project</button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((p) => {
              const progress = p.taskCounts.total > 0 ? Math.round((p.taskCounts.done / p.taskCounts.total) * 100) : 0;
              return (
                <div key={p._id} className="project-card" style={{'--card-color': p.color}} onClick={() => navigate(`/projects/${p._id}`)}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <h3>{p.name}</h3>
                    <span className={`role-badge ${p.myRole}`}>{p.myRole}</span>
                  </div>
                  {p.description && <div className="desc">{p.description}</div>}
                  <div className="project-meta">
                    <span><Users size={14} /> {p.members.length}</span>
                    <span><CheckCircle2 size={14} /> {p.taskCounts.done}/{p.taskCounts.total} tasks</span>
                  </div>
                  <div className="progress-bar"><div className="fill" style={{width: `${progress}%`}}></div></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Project</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name</label>
                <input placeholder="e.g. Website Redesign" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} placeholder="Brief project description..." value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Color</label>
                <div style={{display:'flex',gap:'0.5rem',marginTop:'0.3rem'}}>
                  {colors.map((c) => (
                    <div key={c} onClick={() => setForm({...form, color: c})}
                      style={{width:28,height:28,borderRadius:'50%',background:c,cursor:'pointer',border: form.color===c ? '2px solid #fff' : '2px solid transparent',transition:'all 0.2s'}} />
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

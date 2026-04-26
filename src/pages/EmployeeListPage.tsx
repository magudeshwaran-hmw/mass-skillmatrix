import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Download, FileSpreadsheet, Users } from 'lucide-react';
import { toast } from '@/lib/ToastContext';
import { useDark, mkTheme } from '@/lib/themeContext';
import { getAllEmployees, computeCompletion, exportAllToExcel, exportEmployeeToExcel } from '@/lib/localDB';
import { SKILLS } from '@/lib/mockData';
import { formatZensarId, extractZensarId, formatEmployeeDisplay } from '@/lib/zensarIdUtils';

export default function EmployeeListPage() {
  const navigate = useNavigate();
  const { dark } = useDark();
  const T = mkTheme(dark);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'completion'>('completion');
  const [refreshTick, setRefreshTick] = useState(0);

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAllEmployees().then(data => {
      if (!active) return;
      const arr = data.employees || [];
      const skillArr = data.skills || [];
      const mapped = arr.map((e: any) => {
        const zid = e.ZensarID || e.ID || e.id;
        const row = skillArr.find((s: any) => 
          String(s.employeeId) === String(zid) || 
          String(s['Employee ID']) === String(zid) ||
          String(s.EmployeeID) === String(zid)
        ) || {};
        
        const ratingsArray = SKILLS.map(sk => {
          let val = row[sk.name];
          if (sk.name === 'C#' && val === undefined) val = row['C_x0023_'];
          return {
            skillId: sk.id,
            selfRating: parseInt(String(val || 0)) || 0,
            managerRating: null,
            validated: false
          };
        });

        return {
          id: zid,
          name: e.Name || e.name || '',
          email: e.Email || e.email || '',
          phone: e.Phone || e.phone || '',
          designation: e.Designation || e.designation || '',
          department: e.Department || e.department || '',
          primarySkill: e.PrimarySkill || e.primarySkill || '',
          primaryDomain: e.PrimaryDomain || e.primaryDomain || '',
          yearsIT: parseInt(e.YearsIT || e.yearsIT) || 0,
          yearsZensar: parseInt(e.YearsZensar || e.yearsZensar) || 0,
          submitted: e.Submitted === 'Yes' || e.submitted === true,
          skills: ratingsArray
        };
      });
      setEmployees(mapped);
      setLoading(false);
    });
    return () => { active = false; };
  }, [refreshTick]);

  const filtered = useMemo(() => {
    let list = employees.filter(e => {
      const q = search.toLowerCase().trim();
      if (q) {
        const profileMatch =
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.primarySkill.toLowerCase().includes(q) ||
          e.primaryDomain.toLowerCase().includes(q);
        const skillMatch = SKILLS.some(sk =>
          sk.name.toLowerCase().includes(q) &&
          (e.skills.find((r:any) => r.skillId === sk.id)?.selfRating ?? 0) > 0
        );
        if (!profileMatch && !skillMatch) return false;
      }
      if (filterStatus === 'submitted' && !e.submitted) return false;
      if (filterStatus === 'pending' && e.submitted) return false;
      return true;
    });
    return [...list].sort((a, b) =>
      sortBy === 'name'
        ? a.name.localeCompare(b.name)
        : computeCompletion(b.skills) - computeCompletion(a.skills)
    );
  }, [employees, search, filterStatus, sortBy]);

  const card: React.CSSProperties = {
    background: T.card, border: `1px solid ${T.bdr}`,
    borderRadius: 16, backdropFilter: 'blur(10px)',
    padding: '18px 20px',
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', color:T.text }}>
      <RefreshCw size={24} className="animate-spin" />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter',sans-serif", transition: 'background 0.35s, color 0.35s', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 4 }}>Employees</h1>
            <p style={{ color: T.sub, fontSize: 14 }}>{employees.length} team members</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { exportAllToExcel(); toast.success('All data exported!'); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#10B981,#059669)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              <FileSpreadsheet size={15} /> Export All
            </button>
            <button onClick={() => setRefreshTick(t => t+1)} style={{ padding:10, borderRadius:10, background:T.input, border:`1px solid ${T.inputBdr}`, color:T.text, cursor:'pointer' }}><RefreshCw size={15}/></button>
          </div>
        </div>

        {/* Search + Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, skill, department..."
              style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, borderRadius: 10, background: T.input, border: `1px solid ${T.inputBdr}`, color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
            style={{ padding: '10px 14px', borderRadius: 10, background: T.input, border: `1px solid ${T.inputBdr}`, color: T.text, fontSize: 13, cursor: 'pointer' }}>
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="pending">Pending</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
            style={{ padding: '10px 14px', borderRadius: 10, background: T.input, border: `1px solid ${T.inputBdr}`, color: T.text, fontSize: 13, cursor: 'pointer' }}>
            <option value="completion">Sort: Completion</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>

        {/* Employee cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(emp => {
            const pct = computeCompletion(emp.skills);
            return (
              <div key={emp.id} style={{ ...card, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, transition: 'all 0.2s' }}>
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {emp.name.split(' ').map((n:any) => n[0]).join('').slice(0, 2)}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{emp.name}</span>
                    {emp.submitted
                      ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)' }}>✓ Submitted</span>
                      : <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)' }}>⏳ Pending</span>
                    }
                  </div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                    ID: {formatZensarId(emp.id)} · {emp.designation} · {emp.department}
                  </div>
                </div>
                {/* Progress */}
                <div style={{ minWidth: 100, textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444', fontFamily: "'Space Grotesk',sans-serif" }}>{pct}%</div>
                  <div style={{ width: '100%', height: 4, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)', marginTop:4 }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: pct >= 70 ? '#10B981' : '#3B82F6' }} />
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => navigate(`/admin/employee/${formatZensarId(emp.id)}`)}
                    style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#60A5FA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye size={16} />
                  </button>
                  <button onClick={() => { exportEmployeeToExcel(formatZensarId(emp.id)); toast.success(`${emp.name}'s report exported!`); }}
                    style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34D399', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Download size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// Helper icons needed from lucide-react (adding to imports at top)
import { RefreshCw } from 'lucide-react';

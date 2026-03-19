import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResumeUploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.type === 'application/pdf' || f.name.endsWith('.docx'))) {
      setFile(f);
      setAnalyzed(false);
    } else {
      toast.error('Please upload a PDF or DOCX file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setAnalyzed(false); }
  };

  const handleAnalyze = () => {
    if (!file) return;
    setAnalyzing(true);
    toast.info('Analyzing resume with AI...');
    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
      toast.success('Resume analyzed! 8 skills detected.');
    }, 3000);
  };

  return (
    <div className="container max-w-2xl py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Upload Resume</h1>
        <p className="text-muted-foreground mt-2">Our AI will analyze your resume and auto-detect your skills</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
          file ? 'border-success bg-success/5' : 'border-border hover:border-primary/50 bg-card'
        }`}
      >
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <FileText size={48} className="text-success" />
            <div className="font-semibold">{file.name}</div>
            <div className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</div>
            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setAnalyzed(false); }}>
              Change file
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload size={48} className="text-muted-foreground" />
            <div className="font-semibold">Drop your resume here</div>
            <div className="text-sm text-muted-foreground">PDF or DOCX, max 5MB</div>
            <label>
              <input type="file" accept=".pdf,.docx" onChange={handleFileSelect} className="hidden" />
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium cursor-pointer hover:bg-accent/80 transition-colors">
                Browse files
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        {!analyzed ? (
          <Button
            onClick={handleAnalyze}
            disabled={!file || analyzing}
            className="gradient-primary text-primary-foreground"
            size="lg"
          >
            {analyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analyzing... (3s)
              </>
            ) : (
              'Analyze Resume'
            )}
          </Button>
        ) : (
          <Button
            onClick={() => navigate('/employee/skills')}
            className="gradient-secondary text-secondary-foreground"
            size="lg"
          >
            <CheckCircle size={18} />
            Continue to Skill Matrix
          </Button>
        )}
        <Button variant="outline" onClick={() => navigate('/employee/skills')}>
          Skip — Fill Manually
        </Button>
      </div>

      {/* Analysis result preview */}
      {analyzed && (
        <div className="mt-8 bg-card border border-border rounded-xl p-6 animate-slide-up">
          <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-success" />
            Detected Skills
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'Selenium', cat: 'Tool', level: 2 },
              { name: 'Python', cat: 'Technology', level: 2 },
              { name: 'API Testing', cat: 'Application', level: 2 },
              { name: 'Banking', cat: 'Domain', level: 1 },
              { name: 'Manual Testing', cat: 'TestingType', level: 3 },
              { name: 'Git', cat: 'DevOps', level: 2 },
              { name: 'ChatGPT/Prompt Eng.', cat: 'AI', level: 1 },
              { name: 'Java', cat: 'Technology', level: 1 },
            ].map(s => (
              <div key={s.name} className="bg-accent/50 rounded-lg p-3">
                <div className="font-medium text-sm">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.cat} · Level {s.level}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Experience:</span> <span className="font-medium">3 years IT, 1 year Zensar</span></div>
            <div><span className="text-muted-foreground">Primary Skill:</span> <span className="font-medium">Selenium</span></div>
            <div><span className="text-muted-foreground">Primary Domain:</span> <span className="font-medium">Banking</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

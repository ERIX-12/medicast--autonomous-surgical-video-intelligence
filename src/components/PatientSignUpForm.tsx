import { useState } from 'react';
import { ClipboardList } from 'lucide-react';

interface PatientSignUpFormProps {
  onSubmit?: (data: any) => void;
  disabled?: boolean;
}

export default function PatientSignUpForm({ onSubmit, disabled }: PatientSignUpFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    procedureType: '',
    surgeonName: '',
    patientId: '',
    surgeryDate: '',
    duration: '',
    department: '',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
  };

  const inputClasses = `w-full bg-background border border-border text-xs text-foreground px-3 py-2 
    focus:border-accent focus:outline-none placeholder:text-foreground-muted/40 transition-colors`;
  
  const labelClasses = "block text-[11px] font-semibold text-foreground-muted mb-1";

  return (
    <div className="bg-surface border border-border mt-4">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Patient & Session Details</h3>
      </div>
      
      <form id="patient-signup-form" onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Title *</label>
            <input
              type="text"
              name="title"
              required
              disabled={disabled}
              placeholder="e.g. Lap Chole #247"
              value={formData.title}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Procedure Type *</label>
            <div className="relative">
              <select
                name="procedureType"
                required
                disabled={disabled}
                value={formData.procedureType}
                onChange={handleChange}
                className={`${inputClasses} appearance-none pr-8`}
              >
                <option value="" disabled>Select procedure</option>
                <option value="Laparoscopic Cholecystectomy">Laparoscopic Cholecystectomy</option>
                <option value="Appendectomy">Appendectomy</option>
                <option value="Hernia Repair">Hernia Repair</option>
                <option value="Gastric Bypass">Gastric Bypass</option>
                <option value="Other">Other</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-foreground-muted">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Surgeon Name</label>
            <input
              type="text"
              name="surgeonName"
              disabled={disabled}
              placeholder="Dr. Smith"
              value={formData.surgeonName}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Patient ID (Anonymized)</label>
            <input
              type="text"
              name="patientId"
              disabled={disabled}
              placeholder="PT-00123"
              value={formData.patientId}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClasses}>Surgery Date</label>
            <input
              type="date"
              name="surgeryDate"
              disabled={disabled}
              value={formData.surgeryDate}
              onChange={handleChange}
              className={inputClasses}
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div>
            <label className={labelClasses}>Duration (min)</label>
            <input
              type="number"
              name="duration"
              min="1"
              disabled={disabled}
              placeholder="90"
              value={formData.duration}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Department</label>
            <div className="relative">
              <select
                name="department"
                disabled={disabled}
                value={formData.department}
                onChange={handleChange}
                className={`${inputClasses} appearance-none pr-8`}
              >
                <option value="" disabled>Select</option>
                <option value="General Surgery">General Surgery</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Cardiothoracic">Cardiothoracic</option>
                <option value="Neurology">Neurology</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-foreground-muted">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Row 4 */}
        <div>
          <label className={labelClasses}>Notes</label>
          <textarea
            name="notes"
            rows={3}
            disabled={disabled}
            placeholder="Additional observations or context..."
            value={formData.notes}
            onChange={handleChange}
            className={`${inputClasses} resize-none`}
          />
        </div>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { Search, ChevronDown, Stethoscope } from 'lucide-react';
import { allProcedures, getSpecialties } from '../data/procedureKnowledgeBase';
import type { ProcedureKnowledge } from '../data/types';

interface Props {
  onSelect: (procedure: ProcedureKnowledge) => void;
}

export default function ProcedureSelector({ onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [isOpen, setIsOpen] = useState(false);

  const specialties = ['All', ...getSpecialties()];

  const filtered = allProcedures.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.specialty.toLowerCase().includes(search.toLowerCase());
    const matchSpecialty = specialty === 'All' || p.specialty === specialty;
    return matchSearch && matchSpecialty;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Stethoscope className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-heading font-semibold text-foreground tracking-wide uppercase">
          Select Procedure
        </h2>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search procedures..."
          className="w-full bg-surface border border-border text-foreground placeholder:text-foreground-muted
                     pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent
                     transition-colors duration-200"
        />
      </div>

      {/* Specialty filter */}
      <div className="flex gap-2 flex-wrap">
        {specialties.map(s => (
          <button
            key={s}
            onClick={() => setSpecialty(s)}
            className={`px-3 py-1.5 text-xs font-medium tracking-wide transition-colors duration-200 cursor-pointer
              ${specialty === s
                ? 'bg-accent text-background'
                : 'bg-surface border border-border text-foreground-muted hover:text-foreground hover:border-border-active'
              }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Procedure list */}
      <div className="space-y-1 max-h-[340px] overflow-y-auto">
        {filtered.map(p => (
          <button
            key={p.procedureId}
            onClick={() => {
              onSelect(p);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-3 bg-surface border border-border hover:border-accent
                       hover:bg-surface-hover transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                  {p.name}
                </div>
                <div className="text-xs text-foreground-muted mt-0.5">
                  {p.specialty} • ~{p.estimatedDurationMin} min
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-foreground-muted group-hover:text-accent transition-colors -rotate-90" />
            </div>
            <p className="text-xs text-foreground-muted mt-1.5 line-clamp-2">
              {p.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
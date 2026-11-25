import { NoteObject, Project, UserSettings, DailyRecapData } from '../types';

const DB_NAME = 'rocnpad_vault_v1';
const STORE_NOTES = 'notes';
const STORE_PROJECTS = 'projects';
const STORE_SETTINGS = 'settings';
const STORE_RECAPS = 'recaps';

// Default initial settings
export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'industrial-dark',
  encryptionEnabled: true,
  autoExtractOnSave: true,
  userName: 'ROCN Operator',
  isPinProtected: false,
  aiEnabled: true,
  localModelEnabled: true,
  aiConfig: {
    provider: 'gemini',
    apiKey: '',
    useServerProxy: true,
    model: 'gemini-3.7-flash',
  },
};

// Seed Projects
export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj_rocn_vision',
    name: 'ROCN Vision',
    description: 'Next-gen spatial vision and offline camera intelligence suite',
    color: '#3b82f6',
    icon: 'Eye',
    createdAt: '2026-08-10T08:00:00.000Z',
  },
  {
    id: 'proj_rocn_nomad',
    name: 'ROCN Nomad',
    description: 'Hardware companion & smart glasses integration layer',
    color: '#10b981',
    icon: 'Compass',
    createdAt: '2026-08-14T09:30:00.000Z',
  },
  {
    id: 'proj_ux_redesign',
    name: 'OS & App Interface',
    description: 'Minimalist industrial interaction patterns & low-latency canvas',
    color: '#f59e0b',
    icon: 'Layers',
    createdAt: '2026-08-18T14:15:00.000Z',
  },
  {
    id: 'proj_cosmetics_lab',
    name: 'Cosmetics Lab',
    description: 'Biochemical formulation notes, active ingredients & packaging tests',
    color: '#ec4899',
    icon: 'FlaskConical',
    createdAt: '2026-08-20T11:00:00.000Z',
  },
  {
    id: 'proj_personal',
    name: 'Personal & Sparks',
    description: 'Unfiltered ideas, reading highlights, and daily reflections',
    color: '#8b5cf6',
    icon: 'Sparkles',
    createdAt: '2026-08-01T07:00:00.000Z',
  },
];

// Helper to construct timestamps
function getTodayIso(timeStr: string): string {
  const d = new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);
  d.setHours(hours || 12, minutes || 0, 0, 0);
  return d.toISOString();
}

function getPastIso(daysAgo: number, timeStr: string): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const [hours, minutes] = timeStr.split(':').map(Number);
  d.setHours(hours || 12, minutes || 0, 0, 0);
  return d.toISOString();
}

// Initial realistic notes across the ecosystem
export const DEFAULT_NOTES: NoteObject[] = [
  {
    id: 'note_01_today_idea',
    title: 'Build ROCN Vision offline mode',
    content: `Need to architect ROCN Vision so that all inference runs on local edge models without requiring cellular or WiFi uplink.
    
Key architectural requirements:
- WebAssembly + WebGPU pipeline for real-time edge processing.
- Zero data leakage — biometric features and scene vectors stay strictly in memory.
- Instant fallback when network latency spikes >150ms.
- Local SQLite / IndexedDB vector cache for instant scene re-identification.`,
    type: 'idea',
    tags: ['rocn-vision', 'offline-ai', 'architecture', 'edge-computing'],
    project: 'proj_rocn_vision',
    people: ['Alex', 'Dev Team'],
    location: 'Lab Station Alpha',
    isStarred: true,
    tasks: [
      { id: 't1', text: 'Benchmark WebGPU quantization memory on mobile', completed: false, priority: 'high' },
      { id: 't2', text: 'Draft offline cache invalidation spec', completed: true, priority: 'normal' },
    ],
    summary: 'Plan for 100% offline edge processing for ROCN Vision using WebGPU and local vector cache.',
    createdAt: getTodayIso('09:12'),
    updatedAt: getTodayIso('09:15'),
  },
  {
    id: 'note_02_today_photo',
    title: 'Competitor Scanner Interface Analysis',
    content: `Screen captured during testing of competitor scanner workflow.
    
Observations:
1. Too many confirmation dialogs (3 steps to capture a barcode/QR).
2. Cluttered visual viewports obstruct scanning area.
3. Opportunity for ROCN: One-tap automatic shutter with ambient auto-zoom and immediate tactile haptic feedback.`,
    type: 'screenshot',
    tags: ['ux', 'competitor-analysis', 'scanner', 'rocn-vision'],
    project: 'proj_ux_redesign',
    mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    mediaMimeType: 'image/jpeg',
    summary: 'Critique of competitor scanning UX, noting excessive confirmation friction.',
    createdAt: getTodayIso('11:47'),
    updatedAt: getTodayIso('11:48'),
  },
  {
    id: 'note_03_today_redesign',
    title: 'Redesign onboarding flow: zero-barrier capture',
    content: `ROCNpad onboarding should NOT have 6 welcome screens or mandatory account login.
    
Principles:
- First boot opens directly to a blank capture canvas or immediate today stream.
- Zero forced signup. Local storage is active by default.
- Encryption key is generated on client device in the background.
- Show user their first captured thought within 3 seconds of launching.`,
    type: 'note',
    tags: ['onboarding', 'ux', 'philosophy', 'speed'],
    project: 'proj_ux_redesign',
    isStarred: true,
    tasks: [
      { id: 't3', text: 'Remove preliminary setup modal', completed: true },
      { id: 't4', text: 'Verify IndexedDB instant mount without latency', completed: true },
    ],
    createdAt: getTodayIso('14:18'),
    updatedAt: getTodayIso('14:20'),
  },
  {
    id: 'note_04_today_voice',
    title: 'Voice Memo: Scanner heuristics & smart glasses pairing',
    content: `“I think the scanner should automatically detect low light and switch to high-contrast monochrome mode, especially when paired with ROCN Nomad glasses. We should also add a double-tap gesture on the temple to toggle voice recording.”`,
    type: 'voice',
    tags: ['voice-memo', 'rocn-nomad', 'heuristics', 'audio'],
    project: 'proj_rocn_nomad',
    audioDuration: 34,
    audioTranscript: 'I think the scanner should automatically detect low light and switch to high-contrast monochrome mode, especially when paired with ROCN Nomad glasses. We should also add a double-tap gesture on the temple to toggle voice recording.',
    mediaUrl: '',
    createdAt: getTodayIso('17:31'),
    updatedAt: getTodayIso('17:31'),
  },
  {
    id: 'note_05_today_code',
    title: 'Added camera permission & stream handling',
    content: `Implemented clean fallback and error handling for device camera access in mobile viewport:

\`\`\`typescript
async function requestSecureCameraStream(facing: 'user' | 'environment' = 'environment') {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });
    return { ok: true, stream };
  } catch (err) {
    console.warn('[ROCN-Camera] Access denied or unattached device:', err);
    return { ok: false, error: err };
  }
}
\`\`\``,
    type: 'code',
    codeLanguage: 'typescript',
    tags: ['code', 'camera', 'typescript', 'permissions'],
    project: 'proj_rocn_vision',
    createdAt: getTodayIso('20:44'),
    updatedAt: getTodayIso('20:45'),
  },
  {
    id: 'note_06_cosmetics_formula',
    title: 'Cosmetics Formulation: Peptide Barrier Serum v2',
    content: `Laboratory test batch #882 notes:
- Active Ingredients: 3% Copper Tripeptide-1, 5% Niacinamide, 2% Ectoin, Squalane base.
- Viscosity: 4,200 cPs at 25°C.
- Stability: Maintained clear amber color through 72hr accelerated thermal testing (45°C).
- Next Step: Finalize eco-friendly airless pump dispenser spec with manufacturing partner.`,
    type: 'note',
    tags: ['cosmetics', 'formulation', 'peptides', 'lab-test'],
    project: 'proj_cosmetics_lab',
    isStarred: true,
    tasks: [
      { id: 't5', text: 'Review batch #882 microbial culture assay', completed: false, due: '2026-09-05', priority: 'high' },
      { id: 't6', text: 'Send sample bottles to testing lab', completed: false, priority: 'normal' },
    ],
    createdAt: getPastIso(3, '10:15'),
    updatedAt: getPastIso(3, '10:30'),
  },
  {
    id: 'note_07_sept22_log',
    title: 'September 22 — Full Day Activity & System Log',
    content: `September 22 Recap:
- Morning: Conducted deep review of ROCN Nomad hardware prototypes with industrial design team.
- Afternoon: Took 4 high-res photos of anodized aluminum chassis finishes (Space Graphite vs Matte Obsidian).
- Finished task: Completed end-to-end encryption handshake test between ROCNpad and local vault.
- Decision made: Stick with local-first SQLite/IndexedDB architecture rather than cloud-only database to ensure total user privacy and zero data harvesting.`,
    type: 'note',
    tags: ['september-22', 'activity-log', 'rocn-nomad', 'hardware', 'privacy'],
    project: 'proj_rocn_nomad',
    location: 'Design Studio 4B',
    people: ['Marcus', 'Elena'],
    tasks: [
      { id: 't7', text: 'Finalize chassis anodization sample selection', completed: true },
      { id: 't8', text: 'Benchmark local encryption throughput', completed: true },
    ],
    summary: 'Full activity record for September 22 including Nomad hardware prototyping, chassis decisions, and local encryption validation.',
    createdAt: '2026-09-22T08:30:00.000Z',
    updatedAt: '2026-09-22T19:45:00.000Z',
  },
  {
    id: 'note_08_sketch_diagram',
    title: 'ROCN Nomad Optical Path Sketch',
    content: `Waveguide geometry and eye-box projection diagram. Optical ray tracing indicates 42-degree field of view with sub-12ms photon-to-motion latency.`,
    type: 'drawing',
    tags: ['optics', 'drawing', 'hardware', 'rocn-nomad'],
    project: 'proj_rocn_nomad',
    mediaUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"><rect width="100%" height="100%" fill="%2314171f"/><circle cx="150" cy="150" r="80" stroke="%233b82f6" stroke-width="3" fill="none"/><line x1="150" y1="150" x2="450" y2="150" stroke="%2310b981" stroke-width="2" stroke-dasharray="6,6"/><rect x="420" y="110" width="120" height="80" rx="8" fill="%23222834" stroke="%2360a5fa" stroke-width="2"/><text x="440" y="155" fill="%23e2e8f0" font-family="monospace" font-size="14">Waveguide</text><text x="120" y="155" fill="%2393c5fd" font-family="monospace" font-size="14">Emitter</text></svg>',
    mediaMimeType: 'image/svg+xml',
    createdAt: getPastIso(5, '16:00'),
    updatedAt: getPastIso(5, '16:10'),
  },
  {
    id: 'note_09_spark_thought',
    title: 'Quick Thought: The Anti-Social Network',
    content: `What if the best software is completely private? Not a feed to broadcast to followers, but a quiet mirror for your own intellect. Notes that remember why you wrote them, not algorithms trying to capture your attention for advertisers.`,
    type: 'thought',
    tags: ['philosophy', 'privacy', 'sparks', 'manifesto'],
    project: 'proj_personal',
    isStarred: true,
    createdAt: getPastIso(7, '23:14'),
    updatedAt: getPastIso(7, '23:14'),
  },
];

class StorageService {
  private db: IDBDatabase | null = null;
  private isInit = false;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NOTES)) {
          const notesStore = db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
          notesStore.createIndex('type', 'type', { unique: false });
          notesStore.createIndex('project', 'project', { unique: false });
          notesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORE_RECAPS)) {
          db.createObjectStore(STORE_RECAPS, { keyPath: 'targetDate' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInit = true;
        resolve(this.db);
      };

      request.onerror = () => {
        console.warn('IndexedDB failed to open, falling back to localStorage');
        reject(request.error);
      };
    });
  }

  // Initialize and seed if empty
  public async init(): Promise<void> {
    try {
      const notes = await this.getAllNotes();
      if (notes.length === 0) {
        // Seed default items
        for (const note of DEFAULT_NOTES) {
          await this.saveNote(note);
        }
        for (const proj of DEFAULT_PROJECTS) {
          await this.saveProject(proj);
        }
        await this.saveSettings(DEFAULT_SETTINGS);
      }
    } catch (e) {
      console.warn('Storage init fallback:', e);
      if (!localStorage.getItem('rocn_notes')) {
        localStorage.setItem('rocn_notes', JSON.stringify(DEFAULT_NOTES));
        localStorage.setItem('rocn_projects', JSON.stringify(DEFAULT_PROJECTS));
        localStorage.setItem('rocn_settings', JSON.stringify(DEFAULT_SETTINGS));
      }
    }
  }

  // --- Notes Operations ---

  public async getAllNotes(): Promise<NoteObject[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NOTES, 'readonly');
        const store = tx.objectStore(STORE_NOTES);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(this.getLocalNotesFallback());
      });
    } catch {
      return this.getLocalNotesFallback();
    }
  }

  // Alias for getAllNotes
  public async getNotes(): Promise<NoteObject[]> {
    return this.getAllNotes();
  }

  public async saveNote(note: NoteObject): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NOTES, 'readwrite');
        const store = tx.objectStore(STORE_NOTES);
        const req = store.put(note);
        req.onsuccess = () => {
          this.syncNoteToLocalStorage(note);
          resolve();
        };
        req.onerror = () => {
          this.syncNoteToLocalStorage(note);
          resolve();
        };
      });
    } catch {
      this.syncNoteToLocalStorage(note);
    }
  }

  public async deleteNote(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NOTES, 'readwrite');
        const store = tx.objectStore(STORE_NOTES);
        const req = store.delete(id);
        req.onsuccess = () => {
          this.deleteLocalNoteFallback(id);
          resolve();
        };
        req.onerror = () => {
          this.deleteLocalNoteFallback(id);
          resolve();
        };
      });
    } catch {
      this.deleteLocalNoteFallback(id);
    }
  }

  // --- Projects Operations ---

  public async getAllProjects(): Promise<Project[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_PROJECTS, 'readonly');
        const store = tx.objectStore(STORE_PROJECTS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result?.length ? req.result : DEFAULT_PROJECTS);
        req.onerror = () => resolve(this.getLocalProjectsFallback());
      });
    } catch {
      return this.getLocalProjectsFallback();
    }
  }

  // Alias for getAllProjects
  public async getProjects(): Promise<Project[]> {
    return this.getAllProjects();
  }

  public async saveProject(project: Project): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      tx.objectStore(STORE_PROJECTS).put(project);
    } catch {
      const projs = this.getLocalProjectsFallback().filter(p => p.id !== project.id);
      projs.push(project);
      localStorage.setItem('rocn_projects', JSON.stringify(projs));
    }
  }

  public async deleteProject(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      tx.objectStore(STORE_PROJECTS).delete(id);
    } catch {
      const projs = this.getLocalProjectsFallback().filter(p => p.id !== id);
      localStorage.setItem('rocn_projects', JSON.stringify(projs));
    }
  }

  // --- Settings Operations ---

  public async getSettings(): Promise<UserSettings> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_SETTINGS, 'readonly');
        const store = tx.objectStore(STORE_SETTINGS);
        const req = store.get('user_settings');
        req.onsuccess = () => resolve(req.result ? req.result.data : DEFAULT_SETTINGS);
        req.onerror = () => resolve(DEFAULT_SETTINGS);
      });
    } catch {
      const str = localStorage.getItem('rocn_settings');
      return str ? JSON.parse(str) : DEFAULT_SETTINGS;
    }
  }

  public async saveSettings(settings: UserSettings): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      tx.objectStore(STORE_SETTINGS).put({ id: 'user_settings', data: settings });
    } catch {
      // ignore
    }
    localStorage.setItem('rocn_settings', JSON.stringify(settings));
  }

  // --- Recaps Operations ---
  public async getRecap(targetDate: string): Promise<DailyRecapData | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_RECAPS, 'readonly');
        const store = tx.objectStore(STORE_RECAPS);
        const req = store.get(targetDate);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public async saveRecap(recap: DailyRecapData): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_RECAPS, 'readwrite');
      tx.objectStore(STORE_RECAPS).put(recap);
    } catch {
      localStorage.setItem(`rocn_recap_${recap.targetDate}`, JSON.stringify(recap));
    }
  }

  // --- Clear Vault ---
  public async clearVault(): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction([STORE_NOTES, STORE_PROJECTS], 'readwrite');
      tx.objectStore(STORE_NOTES).clear();
      tx.objectStore(STORE_PROJECTS).clear();
    } catch {
      // ignore
    }
    localStorage.removeItem('rocn_notes');
    localStorage.removeItem('rocn_projects');
  }

  /**
   * Account deletion: wipe EVERYTHING local — notes, projects, settings,
   * recaps, and every rocn_* localStorage key — then delete the whole
   * IndexedDB database so nothing lingers. Call ONLY after the server
   * confirms the auth account is deleted.
   */
  public async wipeAllLocalData(): Promise<void> {
    await this.clearVault();
    try {
      const db = await this.getDB();
      db.close();
      this.db = null;
    } catch {
      // ignore — the database may never have been opened
    }
    try {
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    } catch {
      // ignore
    }
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('rocn_')) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }

  // --- Fallback helpers ---
  private getLocalNotesFallback(): NoteObject[] {
    const raw = localStorage.getItem('rocn_notes');
    return raw ? JSON.parse(raw) : DEFAULT_NOTES;
  }

  private syncNoteToLocalStorage(note: NoteObject): void {
    const notes = this.getLocalNotesFallback().filter(n => n.id !== note.id);
    notes.unshift(note);
    localStorage.setItem('rocn_notes', JSON.stringify(notes));
  }

  private deleteLocalNoteFallback(id: string): void {
    const notes = this.getLocalNotesFallback().filter(n => n.id !== id);
    localStorage.setItem('rocn_notes', JSON.stringify(notes));
  }

  private getLocalProjectsFallback(): Project[] {
    const raw = localStorage.getItem('rocn_projects');
    return raw ? JSON.parse(raw) : DEFAULT_PROJECTS;
  }

  // --- Export / Import ---

  public async exportAllJSON(): Promise<string> {
    const notes = await this.getAllNotes();
    const projects = await this.getAllProjects();
    const settings = await this.getSettings();

    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      system: 'ROCNpad Personal Knowledge Vault',
      totalNotes: notes.length,
      notes,
      projects,
      settings,
    };

    return JSON.stringify(data, null, 2);
  }

  public async exportAllData(): Promise<string> {
    return this.exportAllJSON();
  }

  public async exportAllMarkdown(): Promise<string> {
    const notes = await this.getAllNotes();
    let md = `# ROCNpad Knowledge Archive\nGenerated on: ${new Date().toLocaleString()}\nTotal Objects: ${notes.length}\n\n---\n\n`;

    for (const note of notes) {
      md += `## ${note.title}\n`;
      md += `**ID**: \`${note.id}\` | **Type**: \`${note.type}\` | **Date**: ${new Date(note.createdAt).toLocaleString()}\n`;
      if (note.tags?.length) md += `**Tags**: ${note.tags.map(t => `#${t}`).join(' ')}\n`;
      if (note.project) md += `**Project**: ${note.project}\n`;
      if (note.summary) md += `> **Summary**: ${note.summary}\n\n`;
      md += `${note.content}\n\n`;

      if (note.tasks?.length) {
        md += `### Tasks\n`;
        for (const t of note.tasks) {
          md += `- [${t.completed ? 'x' : ' '}] ${t.text}${t.due ? ` (Due: ${t.due})` : ''}\n`;
        }
        md += `\n`;
      }
      md += `---\n\n`;
    }

    return md;
  }

  public async exportMarkdownFiles(): Promise<string> {
    return this.exportAllMarkdown();
  }

  public async importJSON(jsonStr: string): Promise<{ success: boolean; importedCount: number; error?: string }> {
    try {
      const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      const incomingNotes: NoteObject[] = data.notes || (Array.isArray(data) ? data : []);

      let count = 0;
      for (const note of incomingNotes) {
        if (note && note.id && (note.title || note.content)) {
          await this.saveNote(note);
          count++;
        }
      }

      if (data.projects && Array.isArray(data.projects)) {
        for (const p of data.projects) {
          await this.saveProject(p);
        }
      }

      return { success: true, importedCount: count };
    } catch (err: any) {
      return { success: false, importedCount: 0, error: err.message || 'Invalid JSON format' };
    }
  }

  public async importData(incoming: any): Promise<void> {
    await this.importJSON(incoming);
  }

  public async resetToDefaults(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction([STORE_NOTES, STORE_PROJECTS], 'readwrite');
    tx.objectStore(STORE_NOTES).clear();
    tx.objectStore(STORE_PROJECTS).clear();

    for (const note of DEFAULT_NOTES) {
      await this.saveNote(note);
    }
    for (const proj of DEFAULT_PROJECTS) {
      await this.saveProject(proj);
    }
  }
}

export const storage = new StorageService();

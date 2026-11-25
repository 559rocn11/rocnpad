import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Key,
  Database,
  Download,
  Upload,
  Trash2,
  Lock,
  Check,
  HardDrive,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  BookOpen,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { UserSettings, NoteObject } from '../../types';
import { storage } from '../../services/storage';
import {
  downloadFullExport,
  sendReauthCode,
  verifyReauthCode,
  requestAccountDeletion,
  wipeLocalAccountData,
  signOutLocally,
} from '../../services/accountService';

interface SettingsViewProps {
  settings: UserSettings;
  notes: NoteObject[];
  onUpdateSettings: (newSettings: UserSettings) => void;
  onExportJSON: () => void;
  onExportMarkdown: () => void;
  onImportBackup: (importedData: any) => void;
  onClearVault: () => void;
  onOpenReadwiseSync?: () => void;
  onOpenGuide?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  notes,
  onUpdateSettings,
  onExportJSON,
  onExportMarkdown,
  onImportBackup,
  onClearVault,
  onOpenReadwiseSync,
  onOpenGuide,
}) => {
  const [geminiKey, setGeminiKey] = useState(settings.customApiKey || '');
  const [openaiKey, setOpenaiKey] = useState(settings.openaiKey || '');
  const [claudeKey, setClaudeKey] = useState(settings.claudeKey || '');
  const [openrouterKey, setOpenrouterKey] = useState(settings.openrouterKey || '');
  const [readwiseToken, setReadwiseToken] = useState(settings.readwiseToken || '');
  const [showKeys, setShowKeys] = useState(false);
  const [pinInput, setPinInput] = useState(settings.pinCode || '');
  const [saveToast, setSaveToast] = useState(false);

  // --- Your Data Is Yours: one-click export + account deletion ---
  // Auth is Google-only — there is NO password. Delete confirm is: type
  // DELETE + a 6-digit code emailed to the Google account (re-auth).
  type DeleteStep = 'idle' | 'warn' | 'type' | 'code' | 'confirm' | 'deleting' | 'done';
  const [deleteStep, setDeleteStep] = useState<DeleteStep>('idle');
  const [typeInput, setTypeInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [acctEmail, setAcctEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [acctBusy, setAcctBusy] = useState(false);
  const [acctError, setAcctError] = useState('');
  const [acctStatus, setAcctStatus] = useState('');
  const [exportStatus, setExportStatus] = useState('');

  const handleDownloadMyData = async () => {
    setExportStatus('');
    setAcctError('');
    setAcctBusy(true);
    try {
      const result = await downloadFullExport();
      setExportStatus(
        `Downloaded ${result.fileName} — ${result.noteCount} notes, ${result.projectCount} projects, plus your profile and activity. Keep it somewhere safe: it contains your saved API keys.`,
      );
    } catch (err) {
      setAcctError(err instanceof Error ? err.message : 'Could not download your data.');
    } finally {
      setAcctBusy(false);
    }
  };

  const handleSendCode = async () => {
    setAcctError('');
    setAcctBusy(true);
    try {
      const { email } = await sendReauthCode();
      setAcctEmail(email);
      setCodeSent(true);
    } catch (err) {
      setAcctError(err instanceof Error ? err.message : 'Could not send the code.');
    } finally {
      setAcctBusy(false);
    }
  };

  const handleVerifyCode = async () => {
    setAcctError('');
    setAcctBusy(true);
    try {
      await verifyReauthCode(otpInput);
      setDeleteStep('confirm');
    } catch (err) {
      setAcctError(err instanceof Error ? err.message : 'That code did not work.');
    } finally {
      setAcctBusy(false);
    }
  };

  const handleFinalDelete = async () => {
    setAcctError('');
    setAcctBusy(true);
    setDeleteStep('deleting');
    try {
      const result = await requestAccountDeletion();
      if (!result.ok) {
        setAcctError(result.message ?? 'Account deletion failed.');
        setDeleteStep('confirm');
        return;
      }
      // Server confirmed the account is gone — now wipe the local vault.
      await wipeLocalAccountData();
      setDeleteStep('done');
      setAcctStatus('Your account is deleted. Signing you out…');
      window.setTimeout(() => {
        void signOutLocally();
      }, 2500);
    } catch (err) {
      setAcctError(err instanceof Error ? err.message : 'Account deletion failed.');
      setDeleteStep('confirm');
    } finally {
      setAcctBusy(false);
    }
  };

  const resetDeleteFlow = () => {
    setDeleteStep('idle');
    setTypeInput('');
    setOtpInput('');
    setCodeSent(false);
    setAcctError('');
    setAcctStatus('');
  };

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserSettings = {
      ...settings,
      customApiKey: geminiKey.trim() || undefined,
      openaiKey: openaiKey.trim() || undefined,
      claudeKey: claudeKey.trim() || undefined,
      openrouterKey: openrouterKey.trim() || undefined,
      readwiseToken: readwiseToken.trim() || undefined,
      pinCode: pinInput.trim() || undefined,
      isPinProtected: !!pinInput.trim(),
    };
    onUpdateSettings(updated);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportBackup(parsed);
        alert('Vault backup imported successfully!');
      } catch {
        alert('Invalid backup JSON format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0b0c10]">
      {/* Top Header */}
      <div className="p-6 pb-4 border-b border-[#1c212c] bg-[#0d0f14]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-white font-display">SYSTEM SETTINGS</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#181d28] text-blue-400 border border-[#2b354a] font-mono-code">
            Vault & BYOK
          </span>
        </div>
        <p className="text-xs text-[#717c91] font-mono-code mt-0.5">
          Configure offline vault storage, BYOK API credentials, and cryptographic privacy locks
        </p>
      </div>

      <div className="p-6 max-w-4xl w-full mx-auto space-y-8">
        {/* Toast Alert */}
        {saveToast && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-mono-code">
            <Check className="w-4 h-4" />
            <span>Settings and keys securely encrypted to local device storage.</span>
          </div>
        )}

        {/* Section 0: What is ROCNpad & System Guide */}
        <section className="p-5 rounded-xl bg-gradient-to-r from-blue-950/30 via-[#12151f] to-[#12141a] border border-blue-500/30 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white font-display">About ROCNpad & Operating Guide</h3>
                <p className="text-[11px] text-[#8e9bb0]">Private Cognitive Operating System & Second Brain</p>
              </div>
            </div>

            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open System Guide</span>
              </button>
            )}
          </div>

          <div className="text-xs text-[#cbd5e1] leading-relaxed space-y-2">
            <p>
              <strong className="text-white">ROCNpad</strong> is a sovereign, local-first personal knowledge operating system. It enables thinkers, engineers, and creators to capture unconstrained stream-of-consciousness thoughts, record and translate voice memos with automatic task extraction, ingest Readwise books and articles, organize project tasks, and visualize conceptual links in interactive 2D/3D knowledge graphs.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] text-[#94a3b8]">
              <div className="p-2.5 rounded-lg bg-[#0b0e14] border border-[#1e2434]">
                <strong className="text-white block mb-0.5">100% Private Vault</strong>
                Data stored locally on your device in an encrypted IndexedDB vault with zero telemetry.
              </div>
              <div className="p-2.5 rounded-lg bg-[#0b0e14] border border-[#1e2434]">
                <strong className="text-white block mb-0.5">Voice & Task AI</strong>
                Real-time speech transcription, Gemini task action extraction, and multilingual translation.
              </div>
              <div className="p-2.5 rounded-lg bg-[#0b0e14] border border-[#1e2434]">
                <strong className="text-white block mb-0.5">Connected Knowledge</strong>
                Associative memory, bi-directional backlinks, Readwise highlight syncing, and distraction-free reader.
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Bring Your Own Key (BYOK) */}
        <section className="p-5 rounded-xl bg-[#12141a] border border-[#1e2330] space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-sm text-white font-display">
                Bring Your Own Key (BYOK) Architecture
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowKeys(!showKeys)}
              className="text-xs text-[#8590a6] hover:text-white flex items-center gap-1 font-mono-code"
            >
              {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showKeys ? 'Hide Keys' : 'Reveal Keys'}</span>
            </button>
          </div>

          <p className="text-xs text-[#94a3b8] leading-relaxed">
            ROCNpad works straight out-of-the-box with built-in server-side AI. Optionally, enter your personal API keys below. Your keys are stored <strong className="text-white">strictly on your local device</strong> and never shared.
          </p>

          <form onSubmit={handleSaveKeys} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-mono-code text-[#64748b] block mb-1">
                Google Gemini API Key (Default)
              </label>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full bg-[#0a0c10] border border-[#1f2535] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono-code placeholder:text-[#475569]"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono-code text-[#64748b] block mb-1">
                OpenAI API Key (Optional)
              </label>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="sk-proj-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full bg-[#0a0c10] border border-[#1f2535] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono-code placeholder:text-[#475569]"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono-code text-[#64748b] block mb-1">
                Anthropic Claude API Key (Optional)
              </label>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="sk-ant-..."
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                className="w-full bg-[#0a0c10] border border-[#1f2535] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono-code placeholder:text-[#475569]"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Local Keys</span>
              </button>
            </div>
          </form>
        </section>

        {/* Section: Readwise Knowledge Sync */}
        <section className="p-5 rounded-xl bg-[#12141a] border border-[#1e2330] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white font-display">
                Readwise & Reader Integration
              </h3>
            </div>
            {onOpenReadwiseSync && (
              <button
                type="button"
                onClick={onOpenReadwiseSync}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono-code flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Open Sync Dashboard</span>
              </button>
            )}
          </div>

          <p className="text-xs text-[#94a3b8] leading-relaxed">
            Automatically ingest highlights, articles, tweets, and books from Kindle, iBooks, Twitter, and Readwise Reader straight into your local vault notes.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono-code text-[#64748b] block">
                Readwise Access Token
              </label>
              <a
                href="https://readwise.io/access_token"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-mono-code"
              >
                <span>Generate Token</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="Paste Readwise token..."
                value={readwiseToken}
                onChange={(e) => setReadwiseToken(e.target.value)}
                className="flex-1 bg-[#0a0c10] border border-[#1f2535] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono-code placeholder:text-[#475569]"
              />
              <button
                type="button"
                onClick={handleSaveKeys}
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold font-mono-code shadow-sm"
              >
                Save Token
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Vault Data & Backups */}
        <section className="p-5 rounded-xl bg-[#12141a] border border-[#1e2330] space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white font-display">Local Vault & Export</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono-code">
            <div className="p-3 bg-[#0a0c10] rounded-lg border border-[#1b202c]">
              <div className="text-[10px] text-[#64748b] uppercase">Total Objects</div>
              <div className="text-xl font-bold text-white mt-1">{notes.length}</div>
            </div>

            <div className="p-3 bg-[#0a0c10] rounded-lg border border-[#1b202c]">
              <div className="text-[10px] text-[#64748b] uppercase">Storage Engine</div>
              <div className="text-xs font-bold text-emerald-400 mt-1">IndexedDB / Local</div>
            </div>

            <div className="p-3 bg-[#0a0c10] rounded-lg border border-[#1b202c]">
              <div className="text-[10px] text-[#64748b] uppercase">Encryption Mode</div>
              <div className="text-xs font-bold text-blue-400 mt-1">Client Sandbox</div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono-code">
            <button
              onClick={onExportJSON}
              className="px-3.5 py-2 rounded-lg bg-[#181d28] hover:bg-[#202736] text-white border border-[#2b354a] flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Full JSON Vault</span>
            </button>

            <button
              onClick={onExportMarkdown}
              className="px-3.5 py-2 rounded-lg bg-[#181d28] hover:bg-[#202736] text-white border border-[#2b354a] flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Markdown Archive</span>
            </button>

            <label className="px-3.5 py-2 rounded-lg bg-[#181d28] hover:bg-[#202736] text-white border border-[#2b354a] flex items-center gap-2 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Import JSON Vault</span>
              <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
            </label>
          </div>
        </section>

        {/* Section 3: Passcode Protection */}
        <section className="p-5 rounded-xl bg-[#12141a] border border-[#1e2330] space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-white font-display">Passcode & Vault Security</h3>
          </div>

          <p className="text-xs text-[#94a3b8] leading-relaxed">
            Set an optional PIN passcode to lock your vault when leaving the tab.
          </p>

          <div className="flex items-center gap-3">
            <input
              type="password"
              placeholder="Set 4-digit PIN..."
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="bg-[#0a0c10] border border-[#1f2535] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono-code w-40"
            />
            <button
              onClick={handleSaveKeys}
              className="px-3.5 py-2 rounded-lg bg-[#181d28] hover:bg-[#202736] text-white text-xs font-mono-code border border-[#2b354a]"
            >
              Update PIN
            </button>
          </div>
        </section>

        {/* Danger Zone — Your Data Is Yours */}
        <section className="p-5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-4">
          <div className="flex items-center gap-2 text-rose-400">
            <Trash2 className="w-4 h-4" />
            <h3 className="font-bold text-sm font-display">Your Data Is Yours</h3>
          </div>

          <p className="text-xs text-[#94a3b8] leading-relaxed">
            Delete it or take it with you in one click. Your notes live in this browser only — we never see them.
            Deleting your account removes your sign-in, profile, and activity from our servers, and wipes everything in
            this browser. There is no undo, so download your data first.
          </p>

          {/* Download my data */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadMyData}
              disabled={acctBusy}
              className="px-3.5 py-2 rounded-lg bg-[#181d28] hover:bg-[#202736] text-white border border-[#2b354a] text-xs font-mono-code flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{acctBusy ? 'Working…' : 'Download My Data'}</span>
            </button>
            <span className="text-[11px] text-[#64748b] font-mono-code">
              One JSON file: your profile, activity, notes, projects, and settings.
            </span>
          </div>
          {exportStatus && (
            <p className="text-xs text-emerald-300 leading-relaxed font-mono-code">{exportStatus}</p>
          )}

          {/* Delete my account */}
          {deleteStep === 'idle' && (
            <button
              onClick={() => {
                setAcctError('');
                setDeleteStep('warn');
              }}
              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold font-mono-code shadow-sm"
            >
              Delete My Account
            </button>
          )}

          {deleteStep === 'warn' && (
            <div className="p-4 rounded-lg bg-[#0a0c10] border border-rose-500/30 space-y-3">
              <p className="text-xs text-rose-200 leading-relaxed font-semibold">
                This permanently deletes your account. There is no undo.
              </p>
              <ul className="text-xs text-[#94a3b8] leading-relaxed list-disc pl-4 space-y-1">
                <li>Your sign-in, profile, and activity are removed from our servers.</li>
                <li>All notes, projects, settings, and recaps in this browser are wiped.</li>
                <li>Download your data first if you want to keep anything.</li>
              </ul>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleDownloadMyData}
                  disabled={acctBusy}
                  className="px-3 py-2 rounded-lg bg-[#181d28] hover:bg-[#202736] text-white border border-[#2b354a] text-xs font-mono-code disabled:opacity-50"
                >
                  Download My Data First
                </button>
                <button
                  onClick={() => setDeleteStep('type')}
                  className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold font-mono-code"
                >
                  Continue to Delete
                </button>
                <button
                  onClick={resetDeleteFlow}
                  className="px-3 py-2 rounded-lg bg-transparent text-[#94a3b8] hover:text-white text-xs font-mono-code"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {deleteStep === 'type' && (
            <div className="p-4 rounded-lg bg-[#0a0c10] border border-rose-500/30 space-y-3">
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Type <span className="text-rose-300 font-bold font-mono-code">DELETE</span> to confirm.
              </p>
              <input
                type="text"
                value={typeInput}
                onChange={(e) => setTypeInput(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                className="bg-[#0a0c10] border border-[#1f2535] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono-code w-48 placeholder:text-[#475569]"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDeleteStep('code')}
                  disabled={typeInput !== 'DELETE'}
                  className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold font-mono-code disabled:opacity-40"
                >
                  Continue
                </button>
                <button
                  onClick={resetDeleteFlow}
                  className="px-3 py-2 rounded-lg bg-transparent text-[#94a3b8] hover:text-white text-xs font-mono-code"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {deleteStep === 'code' && (
            <div className="p-4 rounded-lg bg-[#0a0c10] border border-rose-500/30 space-y-3">
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                ROCN Pad signs in with Google only — there is no password. To prove it is really you, we email a
                6-digit code to your Google account address.
              </p>
              {!codeSent ? (
                <button
                  onClick={handleSendCode}
                  disabled={acctBusy}
                  className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold font-mono-code disabled:opacity-50"
                >
                  {acctBusy ? 'Sending…' : 'Send Me the Code'}
                </button>
              ) : (
                <>
                  <p className="text-xs text-emerald-300 font-mono-code">
                    Code sent to {acctEmail}. Check your inbox (and spam).
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit code"
                      autoComplete="one-time-code"
                      className="bg-[#0a0c10] border border-[#1f2535] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono-code w-40 placeholder:text-[#475569]"
                    />
                    <button
                      onClick={handleVerifyCode}
                      disabled={acctBusy || otpInput.length !== 6}
                      className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold font-mono-code disabled:opacity-40"
                    >
                      {acctBusy ? 'Verifying…' : 'Verify Code'}
                    </button>
                    <button
                      onClick={handleSendCode}
                      disabled={acctBusy}
                      className="px-3 py-2 rounded-lg bg-transparent text-[#94a3b8] hover:text-white text-xs font-mono-code disabled:opacity-50"
                    >
                      Resend
                    </button>
                  </div>
                </>
              )}
              <div>
                <button
                  onClick={resetDeleteFlow}
                  className="px-3 py-2 rounded-lg bg-transparent text-[#94a3b8] hover:text-white text-xs font-mono-code"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {(deleteStep === 'confirm' || deleteStep === 'deleting') && (
            <div className="p-4 rounded-lg bg-[#0a0c10] border border-rose-500/30 space-y-3">
              <p className="text-xs text-rose-200 leading-relaxed font-semibold">
                Final step. This deletes your account and wipes this browser's vault. It cannot be undone.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleFinalDelete}
                  disabled={acctBusy}
                  className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold font-mono-code disabled:opacity-50"
                >
                  {acctBusy ? 'Deleting…' : 'Permanently Delete My Account'}
                </button>
                <button
                  onClick={resetDeleteFlow}
                  disabled={acctBusy}
                  className="px-3 py-2 rounded-lg bg-transparent text-[#94a3b8] hover:text-white text-xs font-mono-code disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {deleteStep === 'done' && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <p className="text-xs text-emerald-300 leading-relaxed font-semibold">
                Your account is deleted — sign-in, profile, activity, and everything in this browser.
              </p>
              <p className="text-xs text-[#94a3b8] leading-relaxed">{acctStatus}</p>
            </div>
          )}

          {acctError && deleteStep !== 'done' && (
            <p className="text-xs text-rose-300 leading-relaxed font-mono-code">{acctError}</p>
          )}

          <p className="text-[11px] text-[#64748b] leading-relaxed font-mono-code">
            Prefer email? See{' '}
            <a href="/account-deletion.html" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
              Account Deletion
            </a>{' '}
            — you can also ask us to delete your account or send your data by email.
          </p>

          <div className="pt-2 border-t border-rose-500/10">
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Permanently erase all local notes, media recordings, and projects from this browser only (keeps your
              account). This action cannot be reversed.
            </p>
            <button
              onClick={() => {
                if (confirm('Are you absolutely sure? This will delete all notes and projects in your local vault!')) {
                  onClearVault();
                }
              }}
              className="mt-2 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold font-mono-code shadow-sm"
            >
              Purge Local Vault
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

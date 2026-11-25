import { ReadwiseBook, ReadwiseHighlight, NoteObject } from '../types';

// Curated Sample Library for instant preview/offline demonstration
export const SAMPLE_READWISE_BOOKS: ReadwiseBook[] = [
  {
    id: 'rw_book_01',
    title: 'Thinking in Systems: A Primer',
    author: 'Donella H. Meadows',
    category: 'books',
    num_highlights: 5,
    cover_image_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80',
    source: 'Kindle',
    last_highlight_at: '2026-08-28T14:22:00Z',
    summary: 'A foundational framework on system archetypes, feedback loops, delays, and leverage points.',
    tags: [{ id: 1, name: 'systems-thinking' }, { id: 2, name: 'complexity' }],
    highlights: [
      {
        id: 'hl_01',
        text: 'A system is an interconnected set of elements coherently organized in a way that achieves something (its function or purpose).',
        note: 'Core definition of a system.',
        location: 142,
        highlighted_at: '2026-08-28T14:20:00Z',
      },
      {
        id: 'hl_02',
        text: 'If you want to understand the deepest malfunctions of systems, pay attention to the rules and to who has power over them.',
        note: 'Rules determine systemic power dynamics.',
        location: 512,
        highlighted_at: '2026-08-28T14:21:00Z',
      },
      {
        id: 'hl_03',
        text: 'The highest leverage point to intervene in a system is the mindset or paradigm out of which the system arises.',
        note: 'Paradigm shifts create nonlinear impact.',
        location: 789,
        highlighted_at: '2026-08-28T14:22:00Z',
      },
      {
        id: 'hl_04',
        text: 'Delays in feedback loops are critical sources of system oscillations. Shortening information delays frequently improves responsiveness.',
        location: 940,
        highlighted_at: '2026-08-28T14:24:00Z',
      },
      {
        id: 'hl_05',
        text: 'Remember that hierarchies are formed to serve the bottom layers, not the top layers. Subsystems must retain sufficient autonomy.',
        location: 1120,
        highlighted_at: '2026-08-28T14:25:00Z',
      },
    ],
  },
  {
    id: 'rw_book_02',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    category: 'books',
    num_highlights: 4,
    cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    source: 'O\'Reilly',
    last_highlight_at: '2026-08-29T10:15:00Z',
    summary: 'The definitive architectural guide to reliability, scalability, maintainability, and distributed data systems.',
    tags: [{ id: 3, name: 'distributed-systems' }, { id: 4, name: 'databases' }, { id: 5, name: 'architecture' }],
    highlights: [
      {
        id: 'hl_06',
        text: 'Reliability means making systems work correctly, even when faults occur. Fault-tolerant systems accept faults and prevent failures.',
        location: 45,
        highlighted_at: '2026-08-29T10:05:00Z',
      },
      {
        id: 'hl_07',
        text: 'In local-first and asynchronous architectures, CRDTs (Conflict-free Replicated Data Types) allow independent concurrent writes without central coordination.',
        note: 'Key reference for ROCNpad local sync!',
        location: 388,
        highlighted_at: '2026-08-29T10:10:00Z',
      },
      {
        id: 'hl_08',
        text: 'An LSM-tree (Log-Structured Merge-tree) turns random writes into sequential writes on an append-only log, dramatically accelerating write throughput.',
        location: 610,
        highlighted_at: '2026-08-29T10:12:00Z',
      },
      {
        id: 'hl_09',
        text: 'Total order broadcast guarantees that all messages are delivered in the same order to all replicas.',
        location: 890,
        highlighted_at: '2026-08-29T10:15:00Z',
      },
    ],
  },
  {
    id: 'rw_article_03',
    title: 'How to Do Great Work',
    author: 'Paul Graham',
    category: 'articles',
    num_highlights: 3,
    source: 'Reader',
    source_url: 'https://paulgraham.com/greatwork.html',
    cover_image_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=400&q=80',
    last_highlight_at: '2026-08-30T18:00:00Z',
    tags: [{ id: 6, name: 'craft' }, { id: 7, name: 'essay' }],
    highlights: [
      {
        id: 'hl_10',
        text: 'The first step is to decide what to work on. The work you choose should have three qualities: it has to be something you have a natural aptitude for, that you have a deep interest in, and that offers scope to do great work.',
        highlighted_at: '2026-08-30T17:50:00Z',
      },
      {
        id: 'hl_11',
        text: 'One of the most valuable kinds of knowledge is knowing what you don\'t have to know. Focus on the core mechanism.',
        note: 'Cognitive compression.',
        highlighted_at: '2026-08-30T17:55:00Z',
      },
      {
        id: 'hl_12',
        text: 'If you want to discover new ideas, look at places where people are making assumptions that seem obviously right, but might actually be wrong.',
        highlighted_at: '2026-08-30T18:00:00Z',
      },
    ],
  },
];

export class ReadwiseService {
  /**
   * Validate Readwise Access Token
   */
  public async validateToken(token: string): Promise<{ valid: boolean; message: string }> {
    if (!token || !token.trim()) {
      return { valid: false, message: 'Please provide a Readwise access token.' };
    }

    try {
      const res = await fetch('/api/readwise/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return { valid: true, message: 'Token verified successfully.' };
      } else {
        return { valid: false, message: data.error || 'Token validation failed.' };
      }
    } catch (err: any) {
      console.warn('Backend proxy validation error, attempting direct check:', err);
      // Fallback direct check
      try {
        const directRes = await fetch('https://readwise.io/api/v2/auth/', {
          headers: { Authorization: `Token ${token.trim()}` },
        });
        if (directRes.status === 204 || directRes.status === 200) {
          return { valid: true, message: 'Token verified directly.' };
        }
      } catch {
        // CORS or offline fallback
      }
      return { valid: false, message: 'Could not connect to Readwise. Check token or network.' };
    }
  }

  /**
   * Fetch all exported books & highlights via Readwise Export API
   */
  public async fetchExport(token: string, updatedAfter?: string): Promise<ReadwiseBook[]> {
    if (!token || !token.trim()) {
      return SAMPLE_READWISE_BOOKS;
    }

    try {
      const res = await fetch('/api/readwise/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), updatedAfter }),
      });

      if (res.ok) {
        const json = await res.json();
        const results = json.data?.results || [];
        if (results.length > 0) {
          return results;
        }
      }
    } catch (err) {
      console.warn('Server readwise export error, trying books fallback:', err);
    }

    // Fallback: try books endpoint
    try {
      const res = await fetch('/api/readwise/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });

      if (res.ok) {
        const json = await res.json();
        const results = json.data?.results || [];
        if (results.length > 0) {
          return results;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch live Readwise books:', e);
    }

    // Return sample set if live fetch failed
    return SAMPLE_READWISE_BOOKS;
  }

  /**
   * Transform a Readwise Book and its highlights into a rich ROCNpad NoteObject
   */
  public transformBookToNote(book: ReadwiseBook): NoteObject {
    const highlights = book.highlights || [];
    const bookTags = (book.tags || []).map((t) => t.name.toLowerCase());
    
    // Construct rich markdown content
    let content = `# ${book.title}\n`;
    content += `**Author**: ${book.author || 'Unknown'}\n`;
    content += `**Category**: ${book.category || 'Reading'} | **Source**: ${book.source || 'Readwise'}\n`;
    if (book.source_url) {
      content += `**URL**: [Original Source](${book.source_url})\n`;
    }
    if (book.summary) {
      content += `\n> **Overview**: ${book.summary}\n`;
    }
    content += `\n---\n\n### Highlights (${highlights.length})\n\n`;

    if (highlights.length === 0) {
      content += `*No highlights synced for this title yet.*\n`;
    } else {
      highlights.forEach((h, index) => {
        content += `> ${h.text}\n`;
        if (h.note) {
          content += `\n**Note**: *${h.note}*\n`;
        }
        const metaParts = [];
        if (h.location) metaParts.push(`Loc ${h.location}`);
        if (h.highlighted_at) metaParts.push(new Date(h.highlighted_at).toLocaleDateString());
        if (metaParts.length > 0) {
          content += `\n— <small>${metaParts.join(' • ')}</small>\n`;
        }
        if (index < highlights.length - 1) {
          content += `\n---\n\n`;
        }
      });
    }

    const noteTags = Array.from(
      new Set([
        'readwise',
        book.category ? book.category.toLowerCase() : 'book',
        ...bookTags,
        book.author ? book.author.toLowerCase().replace(/[^a-z0-9]/g, '-') : '',
      ])
    ).filter(Boolean);

    const noteId = `note_readwise_${book.id || Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const note: NoteObject = {
      id: noteId,
      title: `${book.title} — ${book.author}`,
      content,
      type: 'note',
      tags: noteTags,
      mediaUrl: book.cover_image_url || undefined,
      mediaMimeType: book.cover_image_url ? 'image/jpeg' : undefined,
      summary: book.summary || `Readwise sync containing ${highlights.length} highlight${highlights.length === 1 ? '' : 's'} from "${book.title}" by ${book.author}.`,
      keyTakeaways: highlights.slice(0, 3).map((h) => h.text.slice(0, 120) + (h.text.length > 120 ? '...' : '')),
      createdAt: book.last_highlight_at || book.updated || nowIso,
      updatedAt: nowIso,
      pinned: false,
      isStarred: false,
    };

    return note;
  }
}

export const readwiseService = new ReadwiseService();

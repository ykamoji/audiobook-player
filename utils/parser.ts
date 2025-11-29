import { SubtitleCue } from '../types';

// Helper to convert timestamp string to seconds
// Formats supported: "MM:SS.mmm", "HH:MM:SS.mmm", "HH:MM:SS,mmm"
const parseTime = (timeStr: string): number => {
  if (!timeStr) return 0;
  
  const cleanStr = timeStr.trim().replace(',', '.');
  const parts = cleanStr.split(':');
  
  let seconds = 0;
  
  if (parts.length === 3) {
    // HH:MM:SS.mmm
    seconds += parseInt(parts[0], 10) * 3600;
    seconds += parseInt(parts[1], 10) * 60;
    seconds += parseFloat(parts[2]);
  } else if (parts.length === 2) {
    // MM:SS.mmm
    seconds += parseInt(parts[0], 10) * 60;
    seconds += parseFloat(parts[1]);
  }
  
  return seconds;
};

export const parseSubtitles = async (file: File): Promise<SubtitleCue[]> => {
  const text = await file.text();
  const cues: SubtitleCue[] = [];
  const lines = text.split(/\r?\n/);
  
  let i = 0;
  
  // Detect format roughly
  const isVTT = text.trim().startsWith('WEBVTT');
  
  if (isVTT) {
    // Skip header
    while (i < lines.length && lines[i].trim() !== '') i++;
  }

  while (i < lines.length) {
    let line = lines[i].trim();
    
    // Skip empty lines or just numbers (indices) if followed immediately by timestamps
    if (!line || /^\d+$/.test(line)) {
      // Check if next line is a timestamp, if so, this line was just an index
      if (i + 1 < lines.length && lines[i+1].includes('-->')) {
        // It was an index, proceed to timestamp
        i++;
        line = lines[i].trim();
      } else if (!line) {
        // Just an empty line
        i++;
        continue;
      }
    }

    // Check for Timestamp line
    if (line.includes('-->')) {
      const times = line.split('-->');
      if (times.length === 2) {
        const start = parseTime(times[0]);
        const end = parseTime(times[1].split(' ')[0]); // Handle VTT settings after time
        
        // Collect text
        let content = '';
        i++;
        while (i < lines.length && lines[i].trim() !== '') {
          content += (content ? '\n' : '') + lines[i].trim();
          i++;
        }
        
        // Clean up text (remove VTT tags like <b>, <v>, etc if needed, though simple rendering handles some)
        content = content.replace(/<[^>]*>/g, '');

        cues.push({
          id: crypto.randomUUID(),
          start,
          end,
          text: content
        });
      } else {
        i++;
      }
    } else {
      i++;
    }
  }

  return cues;
};
import * as chrono from 'chrono-node';
import { dateHelpers } from './dateHelpers';

export interface ParsedTask {
  title: string;
  date: string | null;
  time: { start: string; end: string } | null;
}

export function parseTaskInput(input: string, referenceDate?: string | Date | null): ParsedTask {
  // Pre-process common abbreviations
  const processedInput = input
    .replace(/\btomo\b/gi, 'tomorrow')
    .replace(/\btmrw\b/gi, 'tomorrow');

  // Use the reference date if provided, otherwise today
  const refDate = referenceDate ? new Date(referenceDate) : new Date();
  
  // Parse the input using chrono-node
  const parsedResults = chrono.parse(processedInput, refDate, { forwardDate: true });
  
  if (parsedResults.length === 0) {
    // No date found, return just the title
    return {
      title: input.trim(),
      date: null,
      time: null,
    };
  }

  // Get the first parsed date
  const firstResult = parsedResults[0];
  const parsedDate = firstResult.start.date();
  
  // Remove the date text from the title
  // We need to map the index back to the original string if we modified it
  // But simply using the processed input for parsing and title extraction is safer
  // However, we want to preserve the user's original text for the title if possible,
  // minus the date part.
  // Since simple replacement changes length, indexes might be off.
  // A better approach: let chrono parse processedInput, but extract title from processedInput too.
  
  const titleWithoutDate = processedInput
    .slice(0, firstResult.index) + 
    processedInput.slice(firstResult.index + firstResult.text.length);
  
  const cleanTitle = titleWithoutDate
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^(at|on|for|by)\s+/i, '') // Remove leading prepositions
    .trim();

  // Extract time if present
  let time: { start: string; end: string } | null = null;
  if (firstResult.start.get('hour') !== undefined && firstResult.start.get('minute') !== undefined) {
    const startHour = firstResult.start.get('hour');
    const startMinute = firstResult.start.get('minute');
    const start = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
    
    // Check if end time is specified
    let end = start;
    if (firstResult.end && firstResult.end.get('hour') !== undefined) {
      const endHour = firstResult.end.get('hour');
      const endMinute = firstResult.end.get('minute') || 0;
      end = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
    } else {
      // Default to 1 hour duration
      const endDate = new Date(parsedDate);
      endDate.setHours(endDate.getHours() + 1);
      end = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    }
    
    time = { start, end };
  }

  return {
    title: cleanTitle || input.trim(),
    date: dateHelpers.toISOString(parsedDate),
    time,
  };
}

// Get a preview string for showing what was detected
export function getDatePreview(input: string, referenceDate?: string | Date | null): string | null {
  // Pre-process common abbreviations
  const processedInput = input
    .replace(/\btomo\b/gi, 'tomorrow')
    .replace(/\btmrw\b/gi, 'tomorrow');

  const refDate = referenceDate ? new Date(referenceDate) : new Date();
  const parsedResults = chrono.parse(processedInput, refDate, { forwardDate: true });
  
  if (parsedResults.length === 0) {
    return null;
  }

  const firstResult = parsedResults[0];
  const parsedDate = firstResult.start.date();
  
  // Format the time string if time is present
  let timeStr = '';
  if (firstResult.start.get('hour') !== undefined) {
    timeStr = parsedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    // Add end time if present
    if (firstResult.end && firstResult.end.get('hour') !== undefined) {
      const endDate = firstResult.end.date();
      const endTimeStr = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      timeStr = `${timeStr} - ${endTimeStr}`;
    }
  }
  
  // Format the date nicely
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (dateHelpers.isSameDay(parsedDate, today)) {
    if (timeStr) {
      return `Today at ${timeStr}`;
    }
    return 'Today';
  } else if (dateHelpers.isSameDay(parsedDate, tomorrow)) {
    if (timeStr) {
      return `Tomorrow at ${timeStr}`;
    }
    return 'Tomorrow';
  } else {
    const dateStr = parsedDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    if (timeStr) {
      return `${dateStr} at ${timeStr}`;
    }
    return dateStr;
  }
}


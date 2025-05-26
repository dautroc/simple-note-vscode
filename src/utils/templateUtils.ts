import * as path from 'path';
import * as crypto from 'crypto';
import { toTitleCase } from './stringUtils';
import { getISOWeek } from './dateUtils';

export function processPlaceholders(content: string, noteName: string): string {
    let processedContent = content;
    const currentDate = new Date(); 
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    const formattedTime = `${hours}:${minutes}:${seconds}`;
    const formattedDateTime = `${formattedDate} ${formattedTime}`;
    const currentWeek = getISOWeek(currentDate);

    processedContent = processedContent.replace(/\{date\}/g, formattedDate);
    processedContent = processedContent.replace(/\{time\}/g, formattedTime);
    processedContent = processedContent.replace(/\{datetime\}/g, formattedDateTime);
    processedContent = processedContent.replace(/\{year\}/g, year.toString());
    processedContent = processedContent.replace(/\{month\}/g, month);
    processedContent = processedContent.replace(/\{day\}/g, day);
    processedContent = processedContent.replace(/\{week\}/g, currentWeek);

    if (noteName) {
        const noteFileNameBase = path.basename(noteName, path.extname(noteName));
        const formattedTitle = toTitleCase(noteFileNameBase);
        processedContent = processedContent.replace(/\{title\}/g, formattedTitle);
        processedContent = processedContent.replace(/\{note_name\}/g, noteFileNameBase);
    }

    const newUuid = crypto.randomUUID();
    processedContent = processedContent.replace(/\{uuid\}/g, newUuid);

    return processedContent;
} 
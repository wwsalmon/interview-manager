export default function makeFile(name: string, date: string, body: string, notes: string) {
    return `---
name: "${name}"
date: "${date}"
notes: "${notes.replace(/(?:\r\n|\r|\n)/g, '\\n')}"
---
${body}`;
}
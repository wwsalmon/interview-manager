export default function makeLinkFile(name: string, url: string, pub: string, date: string, body: string) {
    return `---
url: "${url}"
pub: "${pub}"
name: "${name}"
date: "${date}"
---
${body}`;
}
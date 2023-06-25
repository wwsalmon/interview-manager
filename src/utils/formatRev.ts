export default function formatRev(transcript: string) {
    const lines = transcript.split("\n");
    const parts = lines.map(line => line.split("    "));
    let output = "";

    for (const i in parts) {
        const part = parts[i];
        if (!part[1] || !part[2]) break;
        const isSameSpeaker = (+i !== 0) && parts[+i - 1][0] === part[0];
        if (isSameSpeaker) output += ` ${part[2]}`;
        else output += `${part[0]}, ${part[1]}:\n${part[2]}\n\n`;
    }

    return output;
}
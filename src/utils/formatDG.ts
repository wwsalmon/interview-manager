export interface DGResponse {
    results: {
        channels: {
            alternatives: {
                paragraphs: {
                    paragraphs: DGParagraph[],
                }
            }[],
        }[],
    },
}

export interface DGParagraph {
    speaker: number,
    sentences: {text: string, start: number, end: number}[],
}

export default function formatDG(data: {results: {channels: {alternatives: {paragraphs: {paragraphs: DGParagraph[]}}[]}[]}}) {
    const paragraphs = data.results.channels[0].alternatives[0].paragraphs.paragraphs;

    let transcript = "";

    for (let paragraph of paragraphs) {
        transcript += processParagraph(paragraph);
    }

    return transcript;
}

function processParagraph(paragraph: DGParagraph) {
    const startSecondsWhole = Math.floor(paragraph.sentences[0].start);
    const hours = Math.floor(startSecondsWhole / 3600).toLocaleString("en-US", {minimumIntegerDigits: 2, useGrouping: false});
    const minutes = Math.floor((startSecondsWhole % 3600) / 3600).toLocaleString("en-US", {minimumIntegerDigits: 2, useGrouping: false});
    const seconds = (startSecondsWhole % 60).toLocaleString("en-US", {minimumIntegerDigits: 2, useGrouping: false});

    let string = `Speaker ${paragraph.speaker}, ${hours}:${minutes}:${seconds}:\n`;

    for (let sentence of paragraph.sentences) {
        string += sentence.text + " ";
    }

    string += "\n\n";
    return string;
}
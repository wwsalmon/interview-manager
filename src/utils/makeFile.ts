export default function makeFile(name: string, date: string, body: string, notes: string) {
    return JSON.stringify({name, date, notes, body});
}
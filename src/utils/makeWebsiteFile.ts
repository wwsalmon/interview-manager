export default function makeWebsiteFile(name: string, url: string, pub: string, date: string, body: string) {
    return JSON.stringify({url, pub, name, date, body});
}
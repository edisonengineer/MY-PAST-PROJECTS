/* Builds a small .docx file for tools/test-cv-tailor.js (and the browser check): a real zip with
   word/document.xml holding headings, bullet paragraphs (Word numbering), a tab and a text box.
   Usage in code: require('./make-test-docx.js')(cvText) → Buffer.  No dependencies. */
'use strict';
const zlib = require('zlib');

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const xml = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function zip(files) {
    const locals = [], centrals = [];
    let offset = 0;
    for (const [name, text] of files) {
        const data = Buffer.from(text, 'utf8'), comp = zlib.deflateRawSync(data), nameB = Buffer.from(name);
        const crc = crc32(data);
        const lh = Buffer.alloc(30);
        lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6); lh.writeUInt16LE(8, 8);
        lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nameB.length, 26);
        locals.push(lh, nameB, comp);
        const ch = Buffer.alloc(46);
        ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(8, 10);
        ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nameB.length, 28); ch.writeUInt32LE(offset, 42);
        centrals.push(ch, nameB);
        offset += 30 + nameB.length + comp.length;
    }
    const cd = Buffer.concat(centrals), end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
    end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
    return Buffer.concat(locals.concat([cd, end]));
}

// Lines starting with "# " become Heading 1, "- " bullets (numbered list), "> " a text box; "\t" stays a tab
module.exports = function makeDocx(cvText) {
    const paras = String(cvText).split('\n').filter((l) => l.trim()).map((l) => {
        const run = (t) => t.split('\t').map(xml).map((p) => '<w:r><w:t xml:space="preserve">' + p + '</w:t></w:r>').join('<w:r><w:tab/></w:r>');
        if (l.startsWith('# ')) return '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr>' + run(l.slice(2)) + '</w:p>';
        if (l.startsWith('- ')) return '<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>' + run(l.slice(2)) + '</w:p>';
        if (l.startsWith('> ')) return '<w:p><w:r><w:pict><v:shape><v:textbox><w:txbxContent><w:p>' + run(l.slice(2)) + '</w:p></w:txbxContent></v:textbox></v:shape></w:pict></w:r></w:p>';
        if (l.startsWith('* ')) return '<w:p>' + run(l.slice(2)).replace(/<w:r>/g, '<w:r><w:rPr><w:b/></w:rPr>') + '</w:p>';   // bold line (a heading without a style)
        return '<w:p>' + run(l) + '</w:p>';
    }).join('');
    const doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:v="urn:schemas-microsoft-com:vml"><w:body>' + paras + '</w:body></w:document>';
    return zip([
        ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
        ['word/document.xml', doc]
    ]);
};

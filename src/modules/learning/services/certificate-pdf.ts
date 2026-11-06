export interface CertificatePdfInput {
  participantName: string;
  courseTitle: string;
  certificateNumber: string;
  issuerName: string;
  issuedAt: Date;
  verificationUrl: string;
}
function safeAscii(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
}
function escapePdf(value: string) {
  return safeAscii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
function text(textValue: string, x: number, y: number, size: number) {
  return "BT /F1 " + size + " Tf 1 0 0 1 " + x + " " + y + " Tm (" + escapePdf(textValue) + ") Tj ET\n";
}

/** Minimal one-page PDF renderer; it embeds no remote fonts or user-supplied markup. */
export function generateCertificatePdf(input: CertificatePdfInput): Buffer {
  const issuedDate = input.issuedAt.toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
  });
  let stream = "";
  stream += "0.12 0.24 0.43 RG 2 w 36 36 770 523 re S\n";
  stream += "0.12 0.24 0.43 RG 1 w 45 45 752 505 re S\n";
  stream += text("JOOMHA EDUCATION", 320, 515, 13);
  stream += text("CERTIFICATE OF COMPLETION", 230, 450, 23);
  stream += text("Diberikan kepada", 350, 397, 11);
  stream += text(safeAscii(input.participantName).slice(0, 62), 210, 350, 25);
  stream += text("Atas keberhasilan menyelesaikan kursus", 285, 309, 11);
  stream += text(safeAscii(input.courseTitle).slice(0, 76), 170, 270, 19);
  stream += text("Tanggal terbit: " + issuedDate, 325, 218, 11);
  stream += text("Nomor sertifikat: " + input.certificateNumber, 300, 187, 10);
  stream += text("Penerbit: " + safeAscii(input.issuerName).slice(0, 52), 330, 143, 10);
  stream += text("Verifikasi: " + safeAscii(input.verificationUrl).slice(0, 112), 90, 78, 8);
  const streamBytes = Buffer.from(stream, "latin1");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Length " + streamBytes.length + " >>\nstream\n" + stream + "endstream",
  ];
  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary")];
  const offsets = [0];
  let offset = chunks[0].length;
  for (let index = 0; index < objects.length; index++) {
    offsets.push(offset);
    const bytes = Buffer.from((index + 1) + " 0 obj\n" + objects[index] + "\nendobj\n", "latin1");
    chunks.push(bytes);
    offset += bytes.length;
  }
  const xrefOffset = offset;
  let xref = "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index++) xref += String(offsets[index]).padStart(10, "0") + " 00000 n \n";
  chunks.push(Buffer.from(
    xref + "trailer\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefOffset + "\n%%EOF",
    "latin1",
  ));
  return Buffer.concat(chunks);
}

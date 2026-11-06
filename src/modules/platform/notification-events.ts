import "server-only";
import type { NotificationCategory } from "@prisma/client";
import { createNotificationFromSystemEvent } from "./notification.service";
export interface PlatformDomainEvent {eventId:string;eventName:string;payload:Record<string,unknown>}
interface Template {category:NotificationCategory;title:string;body:string;resourceUrl:string}
const USER_ID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;\nconst TEMPLATES:Record<string,Template>={
 "OrderPaid":{category:"TRANSACTIONAL",title:"Pembayaran berhasil",body:"Pembayaran Anda telah diverifikasi. Detail pesanan tersedia di akun Joomha.",resourceUrl:"/akun/pesanan"},
 "OrderCancelled":{category:"TRANSACTIONAL",title:"Pesanan dibatalkan",body:"Pesanan Anda telah dibatalkan. Periksa akun untuk melihat informasi lebih lanjut.",resourceUrl:"/akun/pesanan"},
 "EnrollmentCreated":{category:"LEARNING",title:"Kelas sudah tersedia",body:"Pendaftaran kelas Anda berhasil. Silakan buka area pembelajaran untuk mulai belajar.",resourceUrl:"/belajar"},
 "CourseCompleted":{category:"LEARNING",title:"Kelas berhasil diselesaikan",body:"Selamat! Persyaratan penyelesaian kelas telah terpenuhi.",resourceUrl:"/akun/pembelajaran"},
 "CertificateIssued":{category:"LEARNING",title:"Sertifikat diterbitkan",body:"Sertifikat penyelesaian Anda telah diterbitkan dan dapat dilihat dari akun.",resourceUrl:"/akun/sertifikat"},
 "TutoringQuoteAwaitingReview":{category:"TUTORING",title:"Penawaran les menunggu tinjauan",body:"Ada permintaan penawaran les privat yang perlu ditinjau tim Joomha.",resourceUrl:"/admin/les-privat"},
 "QuoteApprovedByInstructor":{category:"TUTORING",title:"Penawaran les siap ditinjau",body:"Instruktur telah meninjau penawaran les Anda. Silakan periksa detail penawaran di akun.",resourceUrl:"/akun/les"},
 "TutoringSessionScheduled":{category:"TUTORING",title:"Jadwal les telah ditetapkan",body:"Jadwal sesi les Anda telah diperbarui. Periksa detailnya di akun.",resourceUrl:"/akun/les"},
 "ConsultationHandedOff":{category:"CONSULTATION",title:"Konsultasi membutuhkan tindak lanjut",body:"Percakapan konsultasi baru menunggu tindak lanjut manusia.",resourceUrl:"/admin/konsultasi"},
 "BusinessProposalApproved":{category:"BUSINESS",title:"Proposal bisnis disetujui",body:"Proposal layanan digitalisasi telah disetujui dan siap ditindaklanjuti.",resourceUrl:"/akun/proyek"},
 "ProjectMilestoneUpdated":{category:"BUSINESS",title:"Pembaruan milestone proyek",body:"Ada pembaruan pada milestone proyek Anda.",resourceUrl:"/akun/proyek"}
};
export async function handlePlatformDomainEvent(event:PlatformDomainEvent){
 const template=TEMPLATES[event.eventName];
 const recipients=Array.isArray(event.payload.recipientUserIds)
  ? event.payload.recipientUserIds.filter((value):value is string=>typeof value==="string"&&USER_ID_PATTERN.test(value))
  : typeof event.payload.userId==="string"&&USER_ID_PATTERN.test(event.payload.userId)?[event.payload.userId]:[];
 if(!template||!event.eventId||recipients.length===0)return {handled:false,created:0};
 const uniqueRecipients=[...new Set(recipients)];
 for(const userId of uniqueRecipients){
  await createNotificationFromSystemEvent({userId,category:template.category,title:template.title,body:template.body,resourceUrl:template.resourceUrl,eventName:event.eventName,dedupeKey:event.eventName+":"+event.eventId+":"+userId});
 }
 return {handled:true,created:uniqueRecipients.length};
}

import "server-only";
import type { NotificationCategory } from "@prisma/client";
import { createNotificationFromSystemEvent } from "./notification.service";
export interface PlatformDomainEvent {eventId:string;eventName:string;payload:Record<string,unknown>}
interface Template {category:NotificationCategory;title:string;body:string;resourceUrl:string}
const TEMPLATES:Record<string,Template>={
 "OrderPaid":{category:"TRANSACTIONAL",title:"Pembayaran berhasil",body:"Pembayaran Anda telah diverifikasi. Detail pesanan tersedia di akun Joomha.",resourceUrl:"/akun/pesanan"},
 "EnrollmentCreated":{category:"LEARNING",title:"Kelas sudah tersedia",body:"Pendaftaran kelas Anda berhasil. Silakan buka area pembelajaran untuk mulai belajar.",resourceUrl:"/belajar"},
 "CertificateIssued":{category:"LEARNING",title:"Sertifikat diterbitkan",body:"Sertifikat penyelesaian Anda telah diterbitkan dan dapat dilihat dari akun.",resourceUrl:"/akun/sertifikat"},
 "TutoringQuoteAwaitingReview":{category:"TUTORING",title:"Penawaran les menunggu tinjauan",body:"Ada permintaan penawaran les privat yang perlu ditinjau tim Joomha.",resourceUrl:"/admin/les-privat"},
 "TutoringScheduled":{category:"TUTORING",title:"Jadwal les telah ditetapkan",body:"Jadwal sesi les Anda telah diperbarui. Periksa detailnya di akun.",resourceUrl:"/akun/les"},
 "HumanHandoffRequested":{category:"CONSULTATION",title:"Konsultasi membutuhkan tindak lanjut",body:"Percakapan konsultasi baru menunggu tindak lanjut manusia.",resourceUrl:"/admin/konsultasi"},
 "BusinessProposalSent":{category:"BUSINESS",title:"Proposal bisnis tersedia",body:"Proposal layanan digitalisasi telah tersedia untuk ditinjau.",resourceUrl:"/akun/proyek"},
 "ProjectMilestoneUpdated":{category:"BUSINESS",title:"Pembaruan milestone proyek",body:"Ada pembaruan pada milestone proyek Anda.",resourceUrl:"/akun/proyek"}
};
/** Trusted server-side adapter for the shared event bus; never call from a browser route. */
export async function handlePlatformDomainEvent(event:PlatformDomainEvent){
 const template=TEMPLATES[event.eventName];
 const recipients=Array.isArray(event.payload.recipientUserIds)
  ? event.payload.recipientUserIds.filter((value):value is string=>typeof value==="string")
  : typeof event.payload.userId==="string"?[event.payload.userId]:[];
 if(!template||!event.eventId||recipients.length===0)return {handled:false,created:0};
 for(const userId of [...new Set(recipients)]){
  await createNotificationFromSystemEvent({userId,category:template.category,title:template.title,body:template.body,resourceUrl:template.resourceUrl,eventName:event.eventName,dedupeKey:event.eventName+":"+event.eventId+":"+userId});
 }
 return {handled:true,created:new Set(recipients).size};
}

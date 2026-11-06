import "server-only";
import { eventBus } from "@/lib/events";
import { handlePlatformDomainEvent } from "./notification-events";
const EVENT_NAMES=[
 "OrderPaid","OrderCancelled","EnrollmentCreated","CourseCompleted","CertificateIssued",
 "TutoringQuoteAwaitingReview","QuoteApprovedByInstructor","TutoringSessionScheduled",
 "ConsultationHandedOff","BusinessProposalApproved","ProjectMilestoneUpdated"
] as const;
type SubscriberRegistry=typeof globalThis&{__joomhaPlatformEventsRegistered?:boolean};
const registry=globalThis as SubscriberRegistry;
if(!registry.__joomhaPlatformEventsRegistered){
 for(const eventName of EVENT_NAMES){
  eventBus.subscribe(eventName,async event=>{
   const payload=event.payload&&typeof event.payload==="object"&&!Array.isArray(event.payload)
    ?event.payload as Record<string,unknown>:{};
   await handlePlatformDomainEvent({eventId:event.eventId,eventName:event.eventName,payload});
  });
 }
 registry.__joomhaPlatformEventsRegistered=true;
}

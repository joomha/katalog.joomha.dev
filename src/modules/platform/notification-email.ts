import type { EmailMessage, EmailSendResult } from "./types";
export interface EmailAdapter { send(message:EmailMessage):Promise<EmailSendResult> }
export class ConsoleEmailAdapter implements EmailAdapter {
 async send(message:EmailMessage):Promise<EmailSendResult>{
  const driver=process.env.MAIL_DRIVER??"console";
  if(driver!=="console")return {ok:false,retryable:false,errorCode:driver==="smtp"?"SMTP_PROVIDER_NOT_IMPLEMENTED":"EMAIL_DRIVER_UNSUPPORTED"};
  if(process.env.NODE_ENV==="production")return {ok:false,retryable:false,errorCode:"EMAIL_PROVIDER_NOT_CONFIGURED"};
  console.info("[email:mock]",{to:message.to,subject:message.subject,messageLength:message.text.length});
  return {ok:true,providerMessageId:"mock-"+Date.now()};
 }
}
export const emailAdapter:EmailAdapter=new ConsoleEmailAdapter();
export async function sendEmailWithRetry(message:EmailMessage,maxAttempts=2):Promise<EmailSendResult>{
 const attempts=Math.max(1,Math.min(maxAttempts,3));
 let last:EmailSendResult={ok:false,retryable:false,errorCode:"NOT_ATTEMPTED"};
 for(let i=0;i<attempts;i++){try{last=await emailAdapter.send(message);}catch{last={ok:false,retryable:true,errorCode:"EMAIL_ADAPTER_ERROR"};}if(last.ok||!last.retryable)return last;}
 return last;
}

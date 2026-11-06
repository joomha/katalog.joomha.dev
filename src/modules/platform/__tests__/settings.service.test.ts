import { describe, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
vi.mock("@/lib/db/prisma",()=>({prisma:{systemSetting:{findMany:vi.fn(),upsert:vi.fn()}}}));
vi.mock("@/modules/identity/guards",()=>({assertPermission:vi.fn()}));
vi.mock("./audit.service",()=>({writeAuditLog:vi.fn()}));
import { parseSystemSettingValue } from "../settings.service";
describe("system settings allowlist",()=>{
 it("accepts known non-secret keys with valid values",()=>{
  expect(parseSystemSettingValue("brandDisplayName","Joomha")).toBe("Joomha");
  expect(parseSystemSettingValue("maxUploadBytes",2048)).toBe(2048);
 });
 it("rejects arbitrary and secret-like keys",()=>{
  expect(()=>parseSystemSettingValue("OPENROUTER_API_KEY","secret")).toThrow("not allowlisted");
  expect(()=>parseSystemSettingValue("DATABASE_URL","postgres://example")).toThrow("not allowlisted");
 });
 it("validates types and bounds",()=>{
  expect(()=>parseSystemSettingValue("maxUploadBytes",-1)).toThrow();
  expect(()=>parseSystemSettingValue("currency","USD")).toThrow();
 });
});

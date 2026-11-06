import { describe, expect, it } from "vitest";
import { parseSystemSettingValue } from "../settings.service";
describe("system settings allowlist",()=>{
 it("accepts known non-secret setting keys with valid values",()=>{
  expect(parseSystemSettingValue("brandDisplayName","Joomha")).toBe("Joomha");
  expect(parseSystemSettingValue("maxUploadBytes",2048)).toBe(2048);
 });
 it("rejects arbitrary keys, including secret-like names",()=>{
  expect(()=>parseSystemSettingValue("OPENROUTER_API_KEY","secret")).toThrow("not allowlisted");
  expect(()=>parseSystemSettingValue("DATABASE_URL","postgres://example")).toThrow("not allowlisted");
 });
 it("validates types and bounded values",()=>{
  expect(()=>parseSystemSettingValue("maxUploadBytes",-1)).toThrow();
  expect(()=>parseSystemSettingValue("currency","USD")).toThrow();
 });
});

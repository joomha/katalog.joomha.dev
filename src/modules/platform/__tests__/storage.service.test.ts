import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>{
 class MockAccessDeniedError extends Error{}
 return {findFirst:vi.fn(),get:vi.fn(),assertAuthenticated:vi.fn(),assertPermission:vi.fn(async()=>{throw new MockAccessDeniedError();}),MockAccessDeniedError};
});
vi.mock("server-only",()=>({}));
vi.mock("@/lib/db/prisma",()=>({prisma:{storedFile:{findFirst:mocks.findFirst}}}));
vi.mock("@/modules/identity/types",()=>({AccessDeniedError:mocks.MockAccessDeniedError}));
vi.mock("@/modules/identity/guards",()=>({assertAuthenticated:mocks.assertAuthenticated,assertPermission:mocks.assertPermission}));
vi.mock("@/lib/storage",()=>({getStorageAdapter:()=>({get:mocks.get})}));
import { getAuthorizedFileAccess } from "../storage.service";
describe("stored file authorization",()=>{
 beforeEach(()=>{vi.clearAllMocks();mocks.assertAuthenticated.mockResolvedValue({id:"other-user",roles:["CUSTOMER"]});mocks.get.mockResolvedValue(new Uint8Array([1,2,3]));});
 it("denies a private file when owner and entitlement do not match",async()=>{
  mocks.findFirst.mockResolvedValue({id:"file-1",ownerId:"owner-1",visibility:"PRIVATE",status:"ACTIVE",storageKey:"aa/key.pdf"});
  await expect(getAuthorizedFileAccess("file-1")).rejects.toThrow("File access denied");
  expect(mocks.get).not.toHaveBeenCalled();
 });
 it("allows public files without requiring user authorization",async()=>{
  mocks.findFirst.mockResolvedValue({id:"file-2",ownerId:null,visibility:"PUBLIC",status:"ACTIVE",storageKey:"aa/key.pdf"});
  await expect(getAuthorizedFileAccess("file-2")).resolves.toMatchObject({bytes:new Uint8Array([1,2,3])});
  expect(mocks.assertAuthenticated).not.toHaveBeenCalled();
 });
});

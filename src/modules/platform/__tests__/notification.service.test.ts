import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({updateMany:vi.fn(),findUnique:vi.fn(),create:vi.fn(),upsert:vi.fn(),assertAuthenticated:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/lib/db/prisma",()=>({prisma:{notification:{updateMany:mocks.updateMany,create:mocks.create,upsert:mocks.upsert},notificationPreference:{findUnique:mocks.findUnique}}}));
vi.mock("@/modules/identity/guards",()=>({assertAuthenticated:mocks.assertAuthenticated}));
vi.mock("../notification-email",()=>({sendEmailWithRetry:vi.fn()}));
import { markNotificationRead } from "../notification.service";
describe("notification ownership",()=>{
 beforeEach(()=>{vi.clearAllMocks();mocks.assertAuthenticated.mockResolvedValue({id:"user-1"});mocks.updateMany.mockResolvedValue({count:1});});
 it("scopes read mutation to the authenticated user",async()=>{
  await markNotificationRead("00000000-0000-4000-8000-000000000001");
  expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({userId:"user-1",id:"00000000-0000-4000-8000-000000000001"})}));
 });
 it("does not claim success for another user's notification",async()=>{
  mocks.updateMany.mockResolvedValue({count:0});
  await expect(markNotificationRead("00000000-0000-4000-8000-000000000002")).resolves.toEqual({updated:false});
 });
});

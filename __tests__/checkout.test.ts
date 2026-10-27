/// <reference types="jest" />
import { POST } from '../app/api/checkout/route';
const mockGetUser=jest.fn();const mockStripeCreate=jest.fn();const mockInsert=jest.fn();const mockUpdate=jest.fn();
jest.mock('@supabase/supabase-js',()=>({createClient:(_url:string,key:string)=>key==='test-public'?{auth:{getUser:mockGetUser}}:{from:()=>({insert:mockInsert,update:mockUpdate})}}));
jest.mock('stripe',()=>({__esModule:true,default:jest.fn().mockImplementation(()=>({checkout:{sessions:{create:mockStripeCreate}}}))}));
const req=(items:unknown,token=true)=>new Request('http://localhost/api/checkout',{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer demo'}:{})},body:JSON.stringify({items})});
describe('checkout authorization and safety',()=>{
 beforeEach(()=>{jest.clearAllMocks();process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='test-public';process.env.SUPABASE_SECRET_KEY='server-secret';process.env.STRIPE_SECRET_KEY='sk_test_example';process.env.NEXT_PUBLIC_SITE_URL='http://localhost:3000';mockGetUser.mockResolvedValue({data:{user:{id:'u1',email:'user@example.com',app_metadata:{providers:['google']}}},error:null});mockInsert.mockReturnValue({select:()=>({single:async()=>({data:{id:'order1'},error:null})})});mockUpdate.mockReturnValue({eq:()=>({eq:async()=>({error:null})})});mockStripeCreate.mockResolvedValue({id:'cs_test_123',url:'https://checkout.stripe.com/test'})});
 it('requires a verified Google session',async()=>{expect((await POST(req([],false))).status).toBe(401);mockGetUser.mockResolvedValue({data:{user:null},error:{}});expect((await POST(req([]))).status).toBe(401)});
 it('rejects live Stripe keys',async()=>{process.env.STRIPE_SECRET_KEY='sk_live_example';expect((await POST(req([{id:'bone-tee',size:'M',quantity:1}]))).status).toBe(503)});
 it('rejects invalid product and quantity before saving',async()=>{expect((await POST(req([{id:'bad',size:'M',quantity:1}]))).status).toBe(400);expect((await POST(req([{id:'bone-tee',size:'M',quantity:999}]))).status).toBe(400);expect(mockInsert).not.toHaveBeenCalled()});
 it('stores and charges the catalog price rather than a client price',async()=>{expect((await POST(req([{id:'bone-tee',size:'M',quantity:1,price:1}]))).status).toBe(200);expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({subtotal_cents:4800,user_id:'u1'}));expect(mockStripeCreate.mock.calls[0][0].line_items[0].price_data.unit_amount).toBe(4800)});
});

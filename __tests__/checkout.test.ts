/// <reference types="jest" />
import { POST } from '../app/api/checkout/route';
const getUser=jest.fn();
jest.mock('@supabase/supabase-js',()=>({createClient:()=>({auth:{getUser}})}));
const req=(items:unknown,token=true)=>new Request('http://localhost/api/checkout',{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer demo'}:{})},body:JSON.stringify({items})});
describe('checkout authorization and safety',()=>{
 beforeEach(()=>{process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='test';process.env.STRIPE_SECRET_KEY='sk_test_example';process.env.NEXT_PUBLIC_SITE_URL='http://localhost:3000';getUser.mockResolvedValue({data:{user:{app_metadata:{providers:['google']}}},error:null})});
 afterEach(()=>jest.restoreAllMocks());
 it('requires a valid Google session',async()=>{expect((await POST(req([],false))).status).toBe(401);getUser.mockResolvedValue({data:{user:null},error:{}});expect((await POST(req([]))).status).toBe(401)});
 it('rejects live keys',async()=>{process.env.STRIPE_SECRET_KEY='sk_live_example';expect((await POST(req([{id:'bone-tee',size:'M',quantity:1}]))).status).toBe(503)});
 it('rejects invalid products and quantities',async()=>{expect((await POST(req([{id:'bad',size:'M',quantity:1}]))).status).toBe(400);expect((await POST(req([{id:'bone-tee',size:'M',quantity:999}]))).status).toBe(400)});
 it('uses trusted product pricing',async()=>{const mock=jest.spyOn(global,'fetch').mockResolvedValue(new Response(JSON.stringify({url:'https://checkout.stripe.com/test'}),{status:200}));expect((await POST(req([{id:'bone-tee',size:'M',quantity:1,price:1}]))).status).toBe(200);const params=mock.mock.calls[0][1]?.body as URLSearchParams;expect(params.get('line_items[0][price_data][unit_amount]')).toBe('4800')});
});

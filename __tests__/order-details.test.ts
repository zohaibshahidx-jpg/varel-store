/// <reference types="jest" />
import {GET} from '../app/api/order-details/route';
const mockUser=jest.fn(),mockOrder=jest.fn(),mockRetrieve=jest.fn();
jest.mock('@supabase/supabase-js',()=>({createClient:()=>({auth:{getUser:mockUser},from:()=>({select:()=>({eq:()=>({eq:()=>({maybeSingle:mockOrder})})})})})}));
jest.mock('stripe',()=>({__esModule:true,default:jest.fn().mockImplementation(()=>({checkout:{sessions:{retrieve:mockRetrieve}}}))}));
const request=(token=true)=>new Request('https://example.com/api/order-details?session_id=cs_test_123',{headers:token?{authorization:'Bearer valid'}:{}});
const order={id:'order-1',status:'paid',currency:'usd',subtotal_cents:4800,stripe_session_id:'cs_test_123'};
beforeEach(()=>{jest.clearAllMocks();process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='public';process.env.STRIPE_SECRET_KEY='sk_test_example';mockUser.mockResolvedValue({data:{user:{id:'user-1'}},error:null});mockOrder.mockResolvedValue({data:order,error:null});mockRetrieve.mockResolvedValue({livemode:false,payment_status:'paid',metadata:{order_id:'order-1'},amount_subtotal:4800,amount_total:4800,currency:'usd',customer_details:{email:'user@example.com'},collected_information:{shipping_details:{name:'Customer'}},total_details:{amount_tax:0,amount_shipping:0,amount_discount:0}})});
it('requires a signed-in user before looking up an order',async()=>{expect((await GET(request(false))).status).toBe(401);expect(mockOrder).not.toHaveBeenCalled()});
it('does not retrieve Stripe details for a missing or unauthorized order',async()=>{mockOrder.mockResolvedValue({data:null,error:null});expect((await GET(request())).status).toBe(404);expect(mockRetrieve).not.toHaveBeenCalled()});
it('returns no customer details while payment is pending',async()=>{mockOrder.mockResolvedValue({data:{...order,status:'pending'},error:null});const response=await GET(request());expect((await response.json()).customer).toBeUndefined();expect(mockRetrieve).not.toHaveBeenCalled()});
it('rejects inconsistent payment details',async()=>{mockRetrieve.mockResolvedValue({livemode:false,payment_status:'paid',metadata:{order_id:'other'},amount_subtotal:4800,currency:'usd'});expect((await GET(request())).status).toBe(502)});
it('returns a verified paid order and delivery details',async()=>{const response=await GET(request());expect(response.status).toBe(200);expect((await response.json()).shipping.name).toBe('Customer')});

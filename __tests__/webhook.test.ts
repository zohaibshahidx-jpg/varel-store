/// <reference types="jest" />
import {POST} from '../app/api/stripe/webhook/route';
const mockConstruct=jest.fn();const mockMaybeSingle=jest.fn();const mockUpdate=jest.fn();
jest.mock('stripe',()=>({__esModule:true,default:jest.fn().mockImplementation(()=>({webhooks:{constructEvent:mockConstruct}}))}));
jest.mock('@supabase/supabase-js',()=>({createClient:()=>({from:()=>({select:()=>({eq:()=>({maybeSingle:mockMaybeSingle})}),update:mockUpdate})})}));
const req=()=>new Request('http://localhost/api/stripe/webhook',{method:'POST',headers:{'stripe-signature':'test'},body:'{}'});
describe('Stripe webhook',()=>{beforeEach(()=>{jest.clearAllMocks();process.env.STRIPE_SECRET_KEY='sk_test_test';process.env.STRIPE_WEBHOOK_SECRET='whsec_test';process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SECRET_KEY='secret';mockMaybeSingle.mockResolvedValue({data:{id:'o1',status:'pending',stripe_session_id:'cs_1',currency:'usd',subtotal_cents:4800},error:null});mockUpdate.mockReturnValue({eq:()=>({neq:async()=>({error:null})})});mockConstruct.mockReturnValue({livemode:false,type:'checkout.session.completed',data:{object:{id:'cs_1',metadata:{order_id:'o1'},client_reference_id:'o1',currency:'usd',amount_subtotal:4800,payment_status:'paid'}}})});
 it('rejects an invalid signature',async()=>{mockConstruct.mockImplementation(()=>{throw Error('bad')});expect((await POST(req())).status).toBe(400);expect(mockUpdate).not.toHaveBeenCalled()});
 it('does not mark an unpaid checkout paid',async()=>{mockConstruct.mockReturnValue({livemode:false,type:'checkout.session.completed',data:{object:{id:'cs_1',metadata:{order_id:'o1'},client_reference_id:'o1',currency:'usd',amount_subtotal:4800,payment_status:'unpaid'}}});expect((await POST(req())).status).toBe(200);expect(mockUpdate).not.toHaveBeenCalled()});
 it('marks a matching verified paid session paid',async()=>{expect((await POST(req())).status).toBe(200);expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({status:'paid',stripe_session_id:'cs_1'}))});
 it('rejects a mismatched session amount',async()=>{mockMaybeSingle.mockResolvedValue({data:{id:'o1',status:'pending',stripe_session_id:'cs_1',currency:'usd',subtotal_cents:1},error:null});expect((await POST(req())).status).toBe(400);expect(mockUpdate).not.toHaveBeenCalled()});
});

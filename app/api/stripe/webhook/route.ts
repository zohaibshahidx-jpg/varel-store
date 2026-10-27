import Stripe from 'stripe';
import {createClient} from '@supabase/supabase-js';
export async function POST(request:Request){
 const key=process.env.STRIPE_SECRET_KEY,secret=process.env.STRIPE_WEBHOOK_SECRET,url=process.env.NEXT_PUBLIC_SUPABASE_URL,adminKey=process.env.SUPABASE_SECRET_KEY;
 if(!key?.startsWith('sk_test_')||!secret||!url||!adminKey)return Response.json({error:'Webhook is not configured.'},{status:503});
 const signature=request.headers.get('stripe-signature');if(!signature)return Response.json({error:'Missing signature.'},{status:400});
 const stripe=new Stripe(key);let event:Stripe.Event;
 try{event=stripe.webhooks.constructEvent(await request.text(),signature,secret)}catch{return Response.json({error:'Invalid signature.'},{status:400})}
 if(event.livemode)return Response.json({error:'Live events are not accepted.'},{status:400});
 if(!['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'].includes(event.type))return Response.json({received:true});
 const session=event.data.object as Stripe.Checkout.Session;const orderId=session.metadata?.order_id;if(!orderId||session.client_reference_id!==orderId)return Response.json({error:'Invalid order reference.'},{status:400});
 const admin=createClient(url,adminKey,{auth:{persistSession:false,autoRefreshToken:false}});const {data:order,error}=await admin.from('orders').select('id,status,stripe_session_id,subtotal_cents,currency').eq('id',orderId).maybeSingle();
 if(error)return Response.json({error:'Order lookup failed.'},{status:500});if(!order)return Response.json({error:'Order not found.'},{status:404});
 if((order.stripe_session_id&&order.stripe_session_id!==session.id)||order.currency!==session.currency||order.subtotal_cents!==session.amount_subtotal)return Response.json({error:'Order details do not match.'},{status:400});
 if(order.status==='paid')return Response.json({received:true});
 const paid=(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded')&&session.payment_status==='paid';
 const status=paid?'paid':event.type==='checkout.session.expired'?'expired':event.type==='checkout.session.async_payment_failed'?'failed':null;
 if(!status)return Response.json({received:true});
 const {error:updateError}=await admin.from('orders').update({status,stripe_session_id:session.id,updated_at:new Date().toISOString(),...(paid?{paid_at:new Date().toISOString()}:{})}).eq('id',orderId).neq('status','paid');
 if(updateError)return Response.json({error:'Order update failed.'},{status:500});return Response.json({received:true});
}

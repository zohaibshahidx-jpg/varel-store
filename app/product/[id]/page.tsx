import { notFound } from 'next/navigation';
import { getProduct } from '../../../lib/catalog';
import ProductView from './product-view';
export default async function ProductPage({params}:{params:Promise<{id:string}>}) {const {id}=await params;const product=getProduct(id);if(!product)notFound();return <ProductView product={product}/>}

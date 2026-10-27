import {products,sideImages,backImages,getProduct,colorOptions} from '../lib/catalog';
describe('product views',()=>{
 it('provides distinct front and back photographs for each product',()=>{expect(sideImages).toHaveLength(products.length);expect(backImages).toHaveLength(products.length);products.forEach((product,i)=>{expect(getProduct(product.id)).toEqual(product);expect(sideImages[i]).toMatch(/^https:\/\//);expect(backImages[i]).toMatch(/^https:\/\//);expect(backImages[i]).not.toBe(sideImages[i]);})});
 it('provides unique product and color identifiers',()=>{expect(new Set(products.map(p=>p.id)).size).toBe(products.length);expect(new Set(colorOptions.map(c=>c.id)).size).toBe(colorOptions.length)});
});

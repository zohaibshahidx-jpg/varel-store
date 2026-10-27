import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import OrderRail from '../app/components/OrderRail';

describe('order rail',()=>{
 it('shows selected products, variants, and the total quantity',()=>{
  const html=renderToStaticMarkup(React.createElement(OrderRail,{items:[{id:'bone-tee',size:'M',color:'Warm',quantity:2},{id:'hoodie',size:'L',color:'Cool',quantity:1}]}));
  expect(html).toContain('3 items');expect(html).toContain('2 selections');expect(html).toContain('Heavyweight tee');expect(html).toContain('Everyday hoodie');expect(html).toContain('Warm / M');expect(html).toContain('Cool / L');
 });
 it('shows cart controls and the line total for the selected quantity',()=>{const html=renderToStaticMarkup(React.createElement(OrderRail,{items:[{id:'bone-tee',size:'M',color:'Warm',quantity:2}],onQuantityChange:()=>{}}));expect(html).toContain('$96.00');expect(html).toContain('Remove one Heavyweight tee');expect(html).toContain('Add one Heavyweight tee')});
 it('places the hanging drop targets before the cart garments',()=>{const html=renderToStaticMarkup(React.createElement(OrderRail,{items:[{id:'bone-tee',size:'M',quantity:1}],onQuantityChange:()=>{}}));expect(html.indexOf('REMOVE ONE')).toBeLessThan(html.indexOf('order-rail-garment'));expect(html.indexOf('ADD ONE')).toBeLessThan(html.indexOf('order-rail-garment'));expect(html).toContain('aria-live="polite"')});
 it('renders nothing for an empty order',()=>{expect(renderToStaticMarkup(React.createElement(OrderRail,{items:[]}))).toBe('')});
 it('keeps historical items visible when a product is no longer in the catalog',()=>{const html=renderToStaticMarkup(React.createElement(OrderRail,{items:[{id:'retired',name:'Retired shirt',size:'S',quantity:1}]}));expect(html).toContain('Retired shirt');expect(html).toContain('Image unavailable')});
});

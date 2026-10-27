import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import OrderRail from '../app/components/OrderRail';

describe('order rail',()=>{
 it('shows selected products, variants, and the total quantity',()=>{
  const html=renderToStaticMarkup(React.createElement(OrderRail,{items:[{id:'bone-tee',size:'M',color:'Warm',quantity:2},{id:'hoodie',size:'L',color:'Cool',quantity:1}]}));
  expect(html).toContain('3 items');expect(html).toContain('2 selections');expect(html).toContain('Heavyweight tee');expect(html).toContain('Everyday hoodie');expect(html).toContain('Warm / M');expect(html).toContain('Cool / L');
 });
 it('renders nothing for an empty order',()=>{expect(renderToStaticMarkup(React.createElement(OrderRail,{items:[]}))).toBe('')});
 it('keeps historical items visible when a product is no longer in the catalog',()=>{const html=renderToStaticMarkup(React.createElement(OrderRail,{items:[{id:'retired',name:'Retired shirt',size:'S',quantity:1}]}));expect(html).toContain('Retired shirt');expect(html).toContain('Image unavailable')});
});

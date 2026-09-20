"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { OwnershipShell } from '@/components/ownership-shell';
import { useMock } from '@/components/mock-provider';
import { ItemCards } from '@/components/item-cards';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export default function Items() {
 const {items}=useMock();const [query,setQuery]=useState('');
 const matches=items.filter(item=>[item.name,item.brand,item.model,item.serial,item.category,item.location,item.retailer].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 return <OwnershipShell><div className="page-wrap"><header className="page-heading"><div><p className="eyebrow">YOUR COLLECTION / {items.length} ITEMS</p><h1>All your things.</h1></div><Button asChild className="action"><Link href="/items/new"><Plus/> Add item</Link></Button></header><label className="search-field"><Search size={20}/><Input aria-label="Search items" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, brand, retailer or location"/></label>{matches.length?<ItemCards items={matches}/>:<section className="panel"><h2>No matching items.</h2><p>Try a different search.</p><Button variant="outline" onClick={()=>setQuery('')}>Clear search</Button></section>}</div></OwnershipShell>;
}

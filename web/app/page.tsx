"use client";
import Link from 'next/link';
import { ItemCategoryIcon } from '@/components/item-category-icon';
import { ArrowRight, Plus } from 'lucide-react';
import { OwnershipShell } from '@/components/ownership-shell';
import { useMock } from '@/components/mock-provider';
import { Button } from '@/components/ui/button';
import { ItemCards } from '@/components/item-cards';
export default function Dashboard() {
 const {items} = useMock();
 const attention = items.find(item => !item.purchaseDate);
 return <OwnershipShell><div className="page-wrap">
  <header className="page-heading"><div><p className="eyebrow">YOUR HOUSEHOLD</p><h1>Everything you own.<br/>A little more together.</h1><p className="intro">{items.length} things on record. One place to look after them.</p></div><Button asChild className="action"><Link href="/items/new"><Plus/> Add item</Link></Button></header>
  <section className="panel mb-8" aria-labelledby="try-demo-heading"><p className="eyebrow">NEW HERE?</p><h2 id="try-demo-heading">Turn a purchase note into an item.</h2><p>Choose a fictional sample, let AI suggest the fields, then correct and confirm them. Your item joins this tab’s collection until refresh.</p><Button asChild className="action mt-4"><Link href="/items/new#demo-samples">Try a sample invoice <ArrowRight size={18}/></Link></Button></section>
  {attention ? <section className="attention-grid"><div><p className="eyebrow">NEEDS ATTENTION / 01</p><h2>One small detail.<br/>More peace of mind.</h2><p>The purchase date for your {attention.name.toLowerCase()} is missing from this record.</p><Button asChild className="action" variant="secondary"><Link href={'/items/'+attention.id}>Review item <ArrowRight/></Link></Button></div><div className="attention-art"><ItemCategoryIcon category={attention.category}/><span className="sticker">1 DETAIL TO REVIEW</span></div></section> : <section className="panel lime"><h2>All caught up.</h2><p>No missing purchase dates in your collection.</p></section>}
  <section className="mt-10"><div className="section-heading"><div><p className="eyebrow">YOUR COLLECTION</p><h2>Familiar things. Better records.</h2></div><Link className="text-link" href="/items">View all <ArrowRight size={18}/></Link></div><ItemCards items={items.slice(0,4)}/></section>
 </div></OwnershipShell>;
}

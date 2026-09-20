"use client";
import { OwnershipShell } from '@/components/ownership-shell';
import { useMock } from '@/components/mock-provider';
import { ItemCards } from '@/components/item-cards';
export default function Locations() {
 const {items}=useMock();const locations=[...new Set(items.map(i=>i.location||'Location not set'))];
 return <OwnershipShell><div className="page-wrap"><p className="eyebrow">PHYSICAL LOCATIONS</p><h1>A place for everything.</h1><p className="intro">Where your items are kept, within your sample household.</p>{locations.map(location=><section key={location} className="mt-9"><h2 className="mb-5">{location}</h2><ItemCards items={items.filter(i=>(i.location||'Location not set')===location)}/></section>)}</div></OwnershipShell>;
}

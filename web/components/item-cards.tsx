import Link from 'next/link';
import { ItemCategoryIcon } from '@/components/item-category-icon';
import { ArrowUpRight, FileText, MapPin } from 'lucide-react';
import { warrantyStatus, type MockItem } from '@/lib/mock-data';
export function ItemCards({ items }: { items: MockItem[] }) {
  return <div className="item-grid">{items.map(item => <Link href={'/items/'+item.id} key={item.id} className="item-card"><div className="item-photo"><ItemCategoryIcon category={item.category}/><span className="photo-tag">{item.category || 'Item'}</span><ArrowUpRight className="photo-arrow"/></div><div className="p-6"><span className="status-badge">Warranty {warrantyStatus(item).toLowerCase()}</span><h3 className="mt-4 text-2xl">{item.name}</h3><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin size={15}/>{item.location || 'Location not set'}</p><p className="mt-5 flex items-center gap-2 text-sm"><FileText size={15}/>{item.documents.length} document{item.documents.length===1?'':'s'}<span className="ml-auto font-bold">View item</span></p></div></Link>)}</div>;
}

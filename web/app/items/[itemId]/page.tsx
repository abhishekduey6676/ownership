import { ItemDetail } from '@/components/item-detail';
export default async function Page({params}: {params: Promise<{itemId:string}>}) {
 const {itemId}=await params;return <ItemDetail id={itemId}/>;
}
